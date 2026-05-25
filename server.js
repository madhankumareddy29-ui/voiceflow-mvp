const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const multer = require("multer");
const fs = require("fs");

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


// =========================
// WHISPER TRANSCRIBE
// =========================

app.post("/transcribe", upload.single("audio"), async (req, res) => {

  try {

    const transcription =
      await openai.audio.transcriptions.create({

        file: fs.createReadStream(req.file.path),

        model: "whisper-1",
      });

    fs.unlinkSync(req.file.path);

    res.json({
      text: transcription.text,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Transcription failed",
    });
  }
});


// =========================
// AI REWRITE
// =========================

app.post("/rewrite", async (req, res) => {

  try {

    const { text, tone } = req.body;

    let toneInstruction = "";

    if (tone === "Professional") {

      toneInstruction =
        "Sound professional, polished, workplace-friendly, and clear.";

    } else if (tone === "Casual") {

      toneInstruction =
        "Sound casual, friendly, natural, and relaxed.";

    } else if (tone === "Executive") {

      toneInstruction =
        "Sound concise, direct, confident, and executive-level.";

    } else if (tone === "Polite") {

      toneInstruction =
        "Make it extra polite, respectful, and warm.";

    } else if (tone === "Concise") {

      toneInstruction =
        "Keep it short, clean, and direct.";

    } else if (tone === "Gen Z") {

      toneInstruction =
        "Use modern Gen Z texting style naturally.";

    } else if (tone === "Email") {

      toneInstruction =
        "Rewrite it like a professional email with proper formatting.";

    } else {

      toneInstruction =
        "Use natural human English.";
    }

    const prompt = `
You are an AI message rewriting assistant.

The user may type:
- broken English
- mixed languages
- Telugu + English
- Hindi + English
- Spanish + English
- slang
- rough thoughts

Your job:
- understand REAL intent
- generate ONLY final polished English message

${toneInstruction}

Rules:
- Output ONLY rewritten message
- Never explain
- Keep original meaning
- Keep natural human tone
- Keep concise
- Avoid robotic wording

User Input:
${text}
`;

    const completion =
      await openai.chat.completions.create({

        model: "gpt-3.5-turbo",

        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 0.7,
      });

    res.json({
      result:
        completion.choices[0].message.content.trim(),
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Rewrite failed",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});