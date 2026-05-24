const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
require('dotenv').config();
const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function createWindow() {
  const win = new BrowserWindow({
    width: 980,
    height: 760,
    minWidth: 840,
    minHeight: 650,
    title: 'VoiceFlow MVP',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('process-audio', async (_event, payload) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY. Add it to your .env file.');
  }

  const { audioBase64, mimeType, tone } = payload;
  const extension = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'wav';
  const audioBuffer = Buffer.from(audioBase64, 'base64');
  const tempPath = path.join(os.tmpdir(), `voiceflow-${Date.now()}.${extension}`);
  fs.writeFileSync(tempPath, audioBuffer);

  try {
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: 'gpt-4o-mini-transcribe'
    });

    const rawText = transcription.text || '';

    const cleanupPrompt = buildCleanupPrompt(tone, rawText);
    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: cleanupPrompt
    });

    const polishedText = response.output_text?.trim() || rawText;
    clipboard.writeText(polishedText);

    return { rawText, polishedText };
  } finally {
    try { fs.unlinkSync(tempPath); } catch (_) {}
  }
});

ipcMain.handle('copy-text', (_event, text) => {
  clipboard.writeText(text || '');
  return true;
});

function buildCleanupPrompt(tone, rawText) {
  const toneGuide = {
    professional: 'Make it polished, professional, clear, and ready to send.',
    email: 'Format it as a clean professional email or message. Keep it concise.',
    short: 'Make it very short, direct, and professional.',
    developer: 'Make it clear for technical work: tickets, status updates, code notes, or engineering messages.',
    casual: 'Make it friendly, casual, and natural while keeping grammar clean.'
  }[tone] || 'Make it polished and professional.';

  return `You are an AI voice typing cleanup assistant.\n\nRules:\n- Keep the speaker's original meaning.\n- Remove filler words like um, uh, like, you know when they are not needed.\n- Fix grammar, punctuation, and sentence flow.\n- Do not invent facts.\n- Do not add extra explanation.\n- Return only the final cleaned text.\n\nTone instruction: ${toneGuide}\n\nRaw transcript:\n${rawText}`;
}
