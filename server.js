const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const multer = require("multer");
const fs = require("fs");
const Stripe = require("stripe");
const admin = require("firebase-admin");

dotenv.config();

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();

app.use("/webhook", express.raw({ type: "application/json" }));
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

app.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("Webhook signature failed:", err.message);
    return res.sendStatus(400);
  }

  try {
    let email = null;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      email = session.customer_email || session.metadata?.userEmail;
    }

    if (event.type === "invoice_payment.paid") {
      const invoicePayment = event.data.object;
      const invoice = await stripe.invoices.retrieve(invoicePayment.invoice);
      email = invoice.customer_email;
    }

    if (email) {
      const userRecord = await admin.auth().getUserByEmail(email);

      await db.collection("users").doc(userRecord.uid).set({
        email: email,
        plan: "pro",
        pro: true,
        rewritesToday: 0,
        updatedAt: new Date(),
      }, { merge: true });

      await db.collection("users").doc(email).set({
        email: email,
        plan: "pro",
        pro: true,
        updatedAt: new Date(),
      }, { merge: true });

      console.log("✅ User upgraded to PRO:", email);
    }

  } catch (err) {
    console.log("Webhook processing error:", err);
  }

  res.sendStatus(200);
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
You are VoiceFlow AI, an expert multilingual communication assistant.

The user may type in any language or mixed language.

Your job:
- Understand the real meaning
- Convert it into fluent English
- Make it natural, human, and useful
- If the user is messaging someone, write it as a polished message
- If a name is mentioned, address that person naturally
- Preserve the original intent
- Output ONLY the final English message

${toneInstruction}

Example:

Input:
liam ki msg cheyali itla liam nen try chesna nv ichina task complete cheyadaniki but adhi avaledu chala try chesna but raledu naku

Output:
Hi Liam,

I tried several times to complete the task you assigned, but unfortunately I wasn't able to finish it successfully. I put in a lot of effort and attempted multiple approaches, but I couldn't get the expected result.

Please let me know if you'd like me to try a different approach.

Thanks.

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