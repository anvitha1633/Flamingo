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

app.use((req, res, next) => {
    console.log(`➡️  Incoming request: ${req.method} ${req.url}`);
    next();
});

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

// --- BOOKING ENDPOINT ---
app.post("/book", async (req, res) => {
    try {
        console.log("📥 Raw body:", req.body);
        const { customerName, customerEmail, appointmentDate, appointmentTime, serviceType } = req.body;

        if (!customerName || !customerEmail || !appointmentDate || !appointmentTime || !serviceType) {
            return res.status(400).json({ error: "Missing required booking fields" });
        }
        console.log("📥 Received booking request:", req.body);
        // 1️⃣ Save booking to Firestore
        const newBooking = {
            customerName,
            phoneNumber,
            appointmentDate,
            appointmentTime,
            serviceType,
            status: "pending",
            createdAt: new Date(),
        };
        const bookingRef = await db.collection("bookings").add(newBooking);
        console.log("✅ Booking stored:", bookingRef.id);

        // 2️⃣ Notify n8n webhook (WhatsApp trigger)
        const webhookUrl = "https://flamingo1.app.n8n.cloud/webhook/appointment-booking";

        const n8nPayload = {
            bookingId: bookingRef.id,
            customerName,
            appointmentDate,
            appointmentTime,
            serviceType,
            status: "pending"
        };

        console.log("📡 Sending payload to n8n:", n8nPayload);
        const n8nResponse = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(n8nPayload),
        });
        const responseText = await n8nResponse.text();
        console.log("🛰️ n8n response status:", n8nResponse.status);
        console.log("🛰️ n8n response text:", responseText);
        if (!n8nResponse.ok) {
            throw new Error(`n8n webhook failed: ${n8nResponse.status}`);
        }

        console.log("✅ n8n workflow triggered successfully.");

        res.json({ success: true, message: "Booking created and WhatsApp notification sent." });
    } catch (error) {
        console.error("🔥 Booking or webhook error:", error);
        res.status(500).json({ error: "Booking failed." });
    }
});

// --- STAFF CONFIRMS BOOKING VIA n8n CALLBACK ---
app.post("/api/whatsapp/confirm", async (req, res) => {
    try {
        const { bookingId } = req.body;
        if (!bookingId) return res.status(400).send("Missing bookingId");

        const ref = db.collection("bookings").doc(bookingId);
        const booking = await ref.get();
        if (!booking.exists) return res.status(404).send("Booking not found");

        await ref.update({ status: "confirmed" });
        console.log(`✅ Booking ${bookingId} confirmed by staff`);

        res.json({ success: true });
    } catch (err) {
        console.error("🔥 Confirm error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// --- STAFF REBOOKS APPOINTMENT VIA n8n CALLBACK ---
app.post("/api/whatsapp/rebook", async (req, res) => {
    try {
        const { bookingId, newDate, newTime } = req.body;
        if (!bookingId) return res.status(400).send("Missing bookingId");

        const ref = db.collection("bookings").doc(bookingId);
        const booking = await ref.get();
        if (!booking.exists) return res.status(404).send("Booking not found");

        await ref.update({
            status: "rebook-suggested",
            ...(newDate && { date: newDate }),
            ...(newTime && { time: newTime }),
        });

        console.log(`🔁 Booking ${bookingId} marked for rebooking`);
        res.json({ success: true });
    } catch (err) {
        console.error("🔥 Rebook error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

app.listen(3000, () =>
    console.log("✅ Secure Flamingo AI backend with Gmail email booking flow running on http://localhost:3000")
);
