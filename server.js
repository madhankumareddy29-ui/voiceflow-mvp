const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/rewrite", async (req, res) => {
  try {
    const { text, tone } = req.body;

    const prompt = `
Rewrite this professionally in a ${tone} tone:

${text}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    res.json({
      result: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Something went wrong",
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});