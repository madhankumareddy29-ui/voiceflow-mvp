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
- Telugu + English mixed text
- rough thoughts
- instructions instead of final sentences

Your job:
- understand the REAL intent
- generate ONLY the final polished message

VERY IMPORTANT:

If user says things like:
- "Frank ki msg cheyali"
- "Teams lo pampali"
- "tell Frank"
- "send update to Frank"

You MUST generate the ACTUAL message TO Frank.

DO NOT say:
- "I sent a message"
- "I will tell Frank"
- "Can you rewrite this"

Convert thoughts directly into the final message.

${toneInstruction}

Rules:
- Output ONLY the rewritten message
- Never explain anything
- Never repeat user instructions
- Keep original meaning
- Keep it natural and human
- Avoid robotic wording
- Keep it realistic
- Keep it concise

Examples:

Input:
Frank ki teams lo msg cheyali that nenu change review state lo petina thanks for heads up ani

Output:
Hey Frank, I moved the change to review state. Thanks for the heads up!

Input:
Frank ki casual ga cheppu nenu change review state lo petina thanks

Output:
Hey Frank, updated the change to review state. Thanks for the heads up!

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