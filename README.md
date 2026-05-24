# VoiceFlow MVP

A simple AI voice typing desktop MVP for professionals.

## What it does

- Records your voice from the desktop app
- Transcribes audio using OpenAI speech-to-text
- Cleans the text into polished professional writing
- Copies final text to clipboard so you can paste it anywhere
- Supports tone modes: Professional, Email, Short, Developer, Casual

## Setup

1. Install Node.js 20+
2. Copy `.env.example` to `.env`
3. Add your OpenAI API key:

```bash
OPENAI_API_KEY=sk-your-key-here
```

4. Install dependencies:

```bash
npm install
```

5. Run app:

```bash
npm start
```

## How to use

1. Open the app
2. Pick a tone
3. Click **Start Recording**
4. Speak naturally
5. Click **Stop & Transcribe**
6. The polished result is copied to clipboard
7. Paste it into ChatGPT, Gmail, Slack, VS Code, ServiceNow, etc.

## Next features to add

- Global shortcut: hold Alt+Space to record
- Auto-paste into active app
- Login + subscription
- Usage limits
- Team dashboard
- Chrome extension version
