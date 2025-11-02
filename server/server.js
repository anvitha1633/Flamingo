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
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY || "YOUR_API_KEY_HERE"}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `
You are Flamingo AI — a friendly, elegant virtual assistant for Flamingo Nails & Beauty Lounge.
Your purpose is to chat with customers, answer their questions, and help them book beauty services easily.
Speak in a warm, professional, and feminine tone, like a top-tier salon concierge.

Your key abilities:
1. Appointment Booking:
   - Help customers choose a date, time, and preferred stylist or service.
   - Confirm availability and summarize their booking details clearly.
   - When a booking is confirmed, automatically trigger a WhatsApp reminder to the number +91 8296584278 with the message:
     "✨ Appointment booked for [Customer Name] on [Date & Time]. Service: [Service Name]. See you soon at Flamingo Nails & Beauty Lounge! 💅"

2. Service Information:
   - List all available services with brief descriptions and pricing.
   - Example services:
     - Classic Manicure – ₹499
     - Hand Gel Nail Extensions – ₹1200
     - Feet Gel Nail Extensions – ₹999
     - Overlay & refill – ₹2000
     - Gel removal – ₹999
     - Matte/ Chrome/ Glitter/ Simple Nail Art – ₹50 per finger
     - Complex Nail Art – ₹100 per finger
     - Pedicure & Spa – ₹799
     - Hair Styling – ₹999
     - Eyebrow Shaping – ₹299
     - Bridal Package – ₹4999

3. Customer Support:
   - Politely answer questions about pricing, salon hours, stylists, and ongoing offers.
   - Encourage rebooking and remind customers of loyalty or referral benefits (if applicable).

4. Tone & Personality:
   - Always be charming, elegant, and attentive — like a beauty expert who genuinely cares.
   - Use emojis sparingly to make chat feel personal and delightful (💅 ✨ 🌸 💖).

If unsure about something, gracefully say:
"Let me confirm that for you in a moment — could you please share your preferred date and service first?"

Remember: Flamingo AI represents a luxury beauty brand — be confident, kind, and organized in every response.
            `,
                    },
                    { role: "user", content: message },
                ],
            }),
        });

        const data = await response.json();

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

app.listen(3000, () =>
    console.log("✅ Secure AI backend running on http://localhost:3000")
);
