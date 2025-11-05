// --- Imports ---
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// --- Load .env ---
dotenv.config();

process.stdout.write("🚀 Server starting...\n");

// --- Express setup ---
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// --- Paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- FIREBASE ADMIN INIT ---
let db;
try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    if (!getApps().length) {
        initializeApp({
            credential: cert(serviceAccount),
        });
        console.log("✅ Firebase Admin initialized using service account.");
    } else {
        console.log("ℹ️ Firebase app already initialized.");
    }

    db = getFirestore(getApp());
} catch (err) {
    console.error("🔥 Firebase initialization failed:", err);
}
// --- EMAILJS HELPER ---
export async function sendEmail(to, subject, message, html) {
    try {
        const data = {
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            template_params: {
                to_email: to,
                subject,
                message,
                html_message: html,
            },
        };

        const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`EmailJS error: ${errText}`);
        }

        console.log("✅ Email sent successfully via EmailJS!");
    } catch (error) {
        console.error("🔥 Email sending failed via EmailJS:", error.message);
    }
}

// --- TEST ROUTE ---
app.get("/", (req, res) => {
    res.send("💅 Flamingo Nails AI Backend with Gmail booking flow is running securely!");
});

// --- FIRESTORE TEST ROUTE ---
app.get("/test-db", async (req, res) => {
    try {
        await db.collection("test").add({ msg: "Hello Flamingo" });
        res.send("✅ Firestore write successful!");
    } catch (e) {
        console.error("🔥 Firestore write failed:", e.message);
        res.status(500).send("🔥 Firestore write failed");
    }
});

// --- TEST EMAIL ROUTE ---


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

// --- Notify staff on WhatsApp via n8n ---
app.post("/notify-staff", async (req, res) => {
    const { customerName, service, date, time, customerEmail } = req.body;
    const n8nWebhook = process.env.N8N_WHATSAPP_WEBHOOK_URL;

    try {
        await fetch(n8nWebhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                phone: "+918296584278", // staff number
                message: `💅 New Booking Request!
Customer: ${customerName}
Service: ${service}
Date: ${date}
Time: ${time}
Email: ${customerEmail}`,
            }),
        });
        console.log("✅ WhatsApp notification sent via n8n");
        res.json({ success: true });
    } catch (err) {
        console.error("🔥 WhatsApp message failed:", err.message);
        res.status(500).json({ error: "Failed to send WhatsApp message" });
    }
});

// --- API route: staff confirms booking via WhatsApp (triggered by n8n) ---
app.post("/api/whatsapp/confirm", async (req, res) => {
    try {
        const { bookingId } = req.body;
        if (!bookingId) return res.status(400).send("Missing bookingId");

        const ref = db.collection("bookings").doc(bookingId);
        const booking = await ref.get();
        if (!booking.exists) return res.status(404).send("Booking not found");

        const data = booking.data();
        await ref.update({ status: "confirmed" });

        // Notify customer
        await sendEmail(
            data.customerEmail,
            "💅 Your Appointment is Confirmed!",
            `Hi ${data.customerName}, your appointment for ${data.service} on ${data.date} at ${data.time} has been confirmed.`,
            `<p>Hi ${data.customerName},</p>
       <p>Your appointment for <b>${data.service}</b> on <b>${data.date}</b> at <b>${data.time}</b> has been confirmed!</p>`
        );

        console.log(`✅ Booking ${bookingId} confirmed via WhatsApp`);
        res.json({ success: true });
    } catch (err) {
        console.error("🔥 WhatsApp confirm error:", err);
        res.status(500).json({ error: "Server error" });
    }
});


// --- API route: staff suggests rebooking via WhatsApp (triggered by n8n) ---
app.post("/api/whatsapp/rebook", async (req, res) => {
    try {
        const { bookingId } = req.body;
        if (!bookingId) return res.status(400).send("Missing bookingId");

        const ref = db.collection("bookings").doc(bookingId);
        const booking = await ref.get();
        if (!booking.exists) return res.status(404).send("Booking not found");

        const data = booking.data();
        await ref.update({ status: "rebook-suggested" });

        await sendEmail(
            data.customerEmail,
            "🔁 Let's Reschedule Your Appointment",
            `Hi ${data.customerName}, our staff will follow up to confirm a new time for your ${data.service} appointment.`,
            `<p>Hi ${data.customerName},</p>
       <p>We’d love to reschedule your <b>${data.service}</b> appointment. Our staff will reach out shortly with new available times.</p>`
        );

        console.log(`🔁 Booking ${bookingId} marked for rebooking via WhatsApp`);
        res.json({ success: true });
    } catch (err) {
        console.error("🔥 WhatsApp rebook error:", err);
        res.status(500).json({ error: "Server error" });
    }
});


// --- STAFF CONFIRMS BOOKING ---


// --- STAFF SUGGESTS NEW TIME ---

app.listen(3000, () =>
    console.log("✅ Secure Flamingo AI backend with Gmail email booking flow running on http://localhost:3000")
);
