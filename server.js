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
      toneInstruction = "Use clean professional workplace English.";
    } else if (tone === "Casual") {
      toneInstruction = "Make it friendly and natural like texting a friend.";
    } else if (tone === "Polite") {
      toneInstruction = "Make it extra polite and respectful.";
    } else if (tone === "Concise") {
      toneInstruction = "Keep it very short and direct.";
    } else if (tone === "Gen Z") {
      toneInstruction = "Use modern Gen Z texting style naturally.";
    }

    const prompt = `
You are a smart communication assistant.

Rewrite the following message into natural human English.

Rules:
- Keep original meaning
- Do NOT sound robotic
- Sound realistic and natural
- Avoid overly formal wording
- Make it easy to read

${toneInstruction}

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