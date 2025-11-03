require("dotenv").config();
process.stdout.write("🚀 Server starting...\n");

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const app = express();
app.use(cors());
app.use(express.json());

// --- FIREBASE INIT ---
initializeApp({
    credential: applicationDefault(),
});
const db = getFirestore();

// --- EMAIL TRANSPORTER (GMAIL) ---
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "anvishett@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD, // 🔐 create at https://myaccount.google.com/apppasswords
    },
});

// --- TEST ROUTE ---
app.get("/", (req, res) => {
    res.send("💅 Flamingo Nails AI Backend with Gmail booking flow is running securely!");
});

// --- AI CHAT ENDPOINT ---
app.post("/ai-chat", async (req, res) => {
    const { message } = req.body;
    console.log("📩 Incoming message:", message);

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY || "YOUR_API_KEY_HERE"}`,
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
   - When a booking is confirmed, automatically send an email to the staff (anvishett@gmail.com) for confirmation.

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
   - Encourage rebooking and remind customers of loyalty or referral benefits.

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

// --- BOOKING ENDPOINT ---
app.post("/book", async (req, res) => {
    const { customerEmail, customerName, service, date, time } = req.body;
    console.log("🗓️ Booking request:", req.body);

    try {
        const bookingId = crypto.randomBytes(8).toString("hex");
        await db.collection("bookings").doc(bookingId).set({
            customerEmail,
            customerName,
            service,
            date,
            time,
            status: "pending",
            createdAt: new Date(),
        });

        const confirmUrl = `${process.env.BASE_URL}/confirm-booking/${bookingId}`;
        const rebookUrl = `${process.env.BASE_URL}/rebook/${bookingId}`;

        const staffMail = {
            from: '"Flamingo Nails AI" <anvishett@gmail.com>',
            to: "anvishett@gmail.com",
            subject: "💅 New Appointment Booking Request",
            html: `
                <h3>New Booking Request</h3>
                <p><b>Customer:</b> ${customerName}</p>
                <p><b>Service:</b> ${service}</p>
                <p><b>Date:</b> ${date}</p>
                <p><b>Time:</b> ${time}</p>
                <p><b>Email:</b> ${customerEmail}</p>
                <br/>
                <p>Please confirm or suggest a new slot:</p>
                <a href="${confirmUrl}" style="background:#28a745;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">✅ Confirm Booking</a>
                &nbsp;&nbsp;
                <a href="${rebookUrl}" style="background:#ffc107;color:#000;padding:10px 20px;border-radius:6px;text-decoration:none;">🕓 Suggest New Time</a>
            `,
        };

        await transporter.sendMail(staffMail);
        res.json({ success: true, message: "Booking email sent to staff!" });
    } catch (err) {
        console.error("🔥 Booking error:", err);
        res.status(500).json({ error: "Booking failed" });
    }
});

// --- STAFF CONFIRMS BOOKING ---
app.get("/confirm-booking/:id", async (req, res) => {
    const { id } = req.params;
    const ref = db.collection("bookings").doc(id);
    const booking = await ref.get();

    if (!booking.exists) return res.status(404).send("Booking not found");
    const data = booking.data();

    await ref.update({ status: "confirmed" });

    // Send confirmation email to customer
    await transporter.sendMail({
        from: '"Flamingo Nails" <anvishett@gmail.com>',
        to: data.customerEmail,
        subject: "💅 Your Appointment is Confirmed!",
        html: `
            <p>Hi ${data.customerName},</p>
            <p>Your appointment for <b>${data.service}</b> on <b>${data.date}</b> at <b>${data.time}</b> has been confirmed!</p>
            <br/>
            <a href="${process.env.BASE_URL}/final-confirm/${id}" style="background:#28a745;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">👍 Confirm</a>
            &nbsp;&nbsp;
            <a href="${process.env.BASE_URL}/rebook/${id}" style="background:#ffc107;color:#000;padding:10px 20px;border-radius:6px;text-decoration:none;">🔁 Rebook</a>
        `,
    });

    res.send("✅ Booking confirmed and email sent to customer.");
});

// --- CUSTOMER FINAL CONFIRMATION ---
app.get("/final-confirm/:id", async (req, res) => {
    const { id } = req.params;
    const ref = db.collection("bookings").doc(id);
    const booking = await ref.get();

    if (!booking.exists) return res.status(404).send("Booking not found");

    await ref.update({ status: "final-confirmed" });
    res.send("🎉 Booking confirmed by customer! It will now appear in MyBookings 💅");
});

// --- STAFF SUGGESTS NEW TIME ---
app.get("/rebook/:id", async (req, res) => {
    const { id } = req.params;
    const ref = db.collection("bookings").doc(id);
    const booking = await ref.get();

    if (!booking.exists) return res.status(404).send("Booking not found");

    await ref.update({ status: "rebook-suggested" });
    res.send("🕓 Please reply to this email with a new available time for the customer.");
});

app.listen(3000, () =>
    console.log("✅ Secure Flamingo AI backend with Gmail email booking flow running on http://localhost:3000")
);
