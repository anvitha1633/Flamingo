require("dotenv").config();

process.stdout.write("🚀 Server starting...\n");

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("💅 Flamingo Nails AI Backend is running securely!");
});

app.post("/ai-chat", async (req, res) => {
    const { message } = req.body;
    console.log("📩 Incoming message:", message);

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY || "YOUR_API_KEY_HERE"}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are Flamingo Nails' assistant." },
                    { role: "user", content: message }
                ]
            }),
        });

        const data = await response.json();

        // Log full OpenAI response
        console.log("🧠 OpenAI API response:", JSON.stringify(data, null, 2));

        if (data.error) {
            console.error("❌ OpenAI API error:", data.error);
            return res.status(500).json({ error: data.error.message });
        }

        res.json({ reply: data.choices[0].message.content });
    } catch (err) {
        console.error("🔥 Backend error:", err);
        res.status(500).json({ error: "AI backend error" });
    }
});


app.listen(3000, () => console.log("✅ Secure AI backend running on http://localhost:3000"));
