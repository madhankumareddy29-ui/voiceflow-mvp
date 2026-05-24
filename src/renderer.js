let mediaRecorder;
let chunks = [];

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const copyBtn = document.getElementById('copyBtn');
const statusEl = document.getElementById('status');
const rawTextEl = document.getElementById('rawText');
const polishedTextEl = document.getElementById('polishedText');
const toneEl = document.getElementById('tone');

startBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);
copyBtn.addEventListener('click', async () => {
  await window.voiceflow.copyText(polishedTextEl.value);
  setStatus('Polished text copied to clipboard.');
});

async function startRecording() {
  try {
    chunks = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      await processRecording();
    };

    mediaRecorder.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
    copyBtn.disabled = true;
    rawTextEl.value = '';
    polishedTextEl.value = '';
    setStatus('Recording... speak naturally.');
  } catch (error) {
    setStatus(`Microphone error: ${error.message}`);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    stopBtn.disabled = true;
    setStatus('Processing audio...');
    mediaRecorder.stop();
  }
}

async function processRecording() {
  try {
    const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
    const audioBase64 = await blobToBase64(blob);

    const result = await window.voiceflow.processAudio({
      audioBase64,
      mimeType: blob.type,
      tone: toneEl.value
    });

    rawTextEl.value = result.rawText;
    polishedTextEl.value = result.polishedText;
    copyBtn.disabled = false;
    setStatus('Done. Polished text copied to clipboard. Paste it anywhere.');
  } catch (error) {
    setStatus(`Error: ${error.message}`);
  } finally {
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function setStatus(message) {
  statusEl.textContent = message;
}
