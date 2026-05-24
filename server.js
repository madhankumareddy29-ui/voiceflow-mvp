const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/rewrite", async (req, res) => {
  try {
    const { text, tone } = req.body;

    let toneInstruction = "";

    if (tone === "Professional") {
      toneInstruction = "Sound professional, clear, workplace-friendly, and polished.";
    } else if (tone === "Casual") {
      toneInstruction = "Sound casual, friendly, relaxed, and natural like texting a coworker.";
    } else if (tone === "Executive") {
      toneInstruction = "Sound concise, confident, executive-level, and direct.";
    } else if (tone === "Polite") {
      toneInstruction = "Make it extra polite, respectful, and warm.";
    } else if (tone === "Concise") {
      toneInstruction = "Keep it very short, clear, and direct.";
    } else if (tone === "Gen Z") {
      toneInstruction = "Use modern Gen Z texting style naturally, but keep it understandable.";
    } else {
      toneInstruction = "Use clean, natural, human English.";
    }

    const prompt = `
You are a smart communication assistant.

Rewrite the message into natural human English.

${toneInstruction}

Rules:
- Keep the original meaning
- Do not add new meaning
- Avoid robotic language
- Keep it realistic
- Do not overcomplicate
- Make it sound naturally written by a human
- Return only the rewritten message, no explanation

Message:
${text}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    res.json({
      result: completion.choices[0].message.content.trim(),
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