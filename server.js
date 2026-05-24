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

    const prompt = `
You are a smart communication assistant.

Rewrite the following message into natural, clean, human professional English.

Rules:
- Keep it short and realistic
- Sound like a real human
- Do NOT sound robotic
- Keep the original meaning
- Make it workplace-friendly
- Avoid overly formal greetings
- Do not add extra meaning

Tone: ${tone}

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