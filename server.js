const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const multer = require("multer");
const fs = require("fs");
const Stripe = require("stripe");

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { email } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",

      customer_email: email,

      metadata: {
        userEmail: email,
      },

      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],

      success_url: "https://voiceflow-mvp.onrender.com/success.html",
      cancel_url: "https://voiceflow-mvp.onrender.com/cancel.html",
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error("STRIPE ERROR:", err);

    res.status(500).json({
      error: "Stripe checkout failed",
      details: err.message,
    });
  }
});

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

app.post("/rewrite", async (req, res) => {
  try {
    const { text, tone } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({
        error: "Please speak or type something first.",
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
- any language in the world
- mixed languages
- broken English
- Telugu + English
- Hindi + English
- slang
- rough thoughts
- voice-transcribed speech
- incomplete thoughts

Your job:
- understand the REAL meaning
- rewrite naturally in clean English
- preserve emotional intent
- sound human

${toneInstruction}

IMPORTANT RULES:
- Output ONLY the rewritten message
- Never explain anything
- Never add commentary
- Never repeat instructions
- Never change the user's meaning
- Preserve emotional tone naturally
- Preserve Telugu slang meaning naturally
- Do NOT translate word-by-word
- Do NOT randomly add words like:
  "bro", "dude", "dad", "man"
  unless user clearly intended them
- Keep workplace messages professional
- Keep casual messages natural
- Keep romantic messages warm
- Keep concise unless email tone selected
- Avoid robotic AI wording
- Avoid cringe Gen Z slang unless user explicitly uses it

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
        temperature: 0.3,
      });

    res.json({
      result: completion.choices[0].message.content.trim(),
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