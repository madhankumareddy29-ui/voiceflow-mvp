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

const upload = multer({
  dest: "uploads/",
});

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
    if (!req.file) {
      return res.status(400).json({
        error: "No audio file received",
      });
    }

    const fixedPath = req.file.path + ".webm";

    fs.renameSync(req.file.path, fixedPath);

    const transcription =
      await openai.audio.transcriptions.create({
        file: fs.createReadStream(fixedPath),
        model: "whisper-1",
      });

    fs.unlinkSync(fixedPath);

    res.json({
      text: transcription.text || "",
    });

  } catch (err) {
    console.error("TRANSCRIBE ERROR:", err);

    res.status(500).json({
      error: "Transcription failed",
      details: err.message,
    });
  }
});


// =========================
// AI REWRITE
// =========================

app.post("/rewrite", async (req, res) => {
  try {
    const { text, tone } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "No text provided",
      });
    }

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
        "Use modern Gen Z texting style naturally without sounding cringe.";
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
- any language in the world
- mixed languages
- broken English
- Telugu + English
- Hindi + English
- Spanish + English
- slang
- rough thoughts
- emotional thoughts
- workplace instructions
- instructions instead of final sentences

Your job:
- understand the REAL intent emotionally and contextually
- convert mixed language thoughts into clean natural English
- preserve emotions and personality
- keep Telugu slang feeling natural
- generate ONLY the final polished message

Important:
- if user says "Frank ki msg pampali", "Frank ki msg cheyali", "message Frank", "tell Frank", "send to Frank", or similar, directly write the message TO Frank
- never say "can you send a message for me"
- if user says "manager ki", "team ki", "client ki", or similar, write the actual message addressed to that person/group
- preserve emotional tone
- do not over-formalize emotional messages
- do not invent meanings
- do not mistranslate Telugu slang
- "nana" can mean "dear", "bro", or emotional emphasis depending on context
- avoid weird translations like "dad" unless clearly talking about father
- keep Gen Z tone modern and natural
- keep Casual tone like real texting
- keep Professional tone workplace-friendly

${toneInstruction}

Rules:
- Output ONLY rewritten message
- Never explain
- Never repeat user instructions
- Keep original meaning
- Keep natural human tone
- Keep concise
- Avoid robotic wording
- If Email tone is selected, use proper email formatting
- If Casual tone is selected, make it sound like a natural Teams/Slack/message
- If Professional tone is selected, make it suitable for workplace communication

Examples:

Input:
arey frank ki msg pampali itla frank sorry for short notice nak health baledu feeling sick konni days naku work from home kavali does it work with you ani

Output:
Hey Frank, sorry for the short notice. I’m not feeling well and need to work from home for a few days. Would that work for you?

Input:
frank ki teams lo msg cheyali that nenu change review state lo petina thanks for heads up ani

Output:
Hey Frank, I moved the change to review state. Thanks for the heads up!

Input:
manager ki cheppu nenu traffic valla late avutanu

Output:
Hi, I’m running late because of traffic.

Input:
tulasi ki itla chepali nenu nana chala istam ra nv ante naku pelli cheskundam next year ending lopu okay na

Output:
Hey Tulasi, I really like you a lot. You mean a lot to me. Can we get married by the end of next year?

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

        temperature: 0.4,
      });

    res.json({
      result:
        completion.choices[0].message.content.trim(),
    });

  } catch (err) {
    console.error("REWRITE ERROR:", err);

    res.status(500).json({
      error: "Rewrite failed",
      details: err.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});