import { Resend } from "resend";
import fetch from "node-fetch";
process.stdout.write("🚀 Server starting...\n");
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import crypto from "crypto";
import path from "path";
import dotenv from "dotenv";
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import Brevo from "@getbrevo/brevo";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const firebaseConfig = {
    apiKey: "AIzaSyDW24NFAz-MQDTaHD974-Go1yNZgpKPNVs",
    projectId: "atproj-a2634",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
};
const app1 = initializeApp(firebaseConfig);
const messaging = getMessaging(app1);

getToken(messaging, { vapidKey: "YOUR_VAPID_KEY" })
    .then((token) => {
        console.log("🔑 FCM Token:", token);
        // Save this token to Firestore under staff_tokens/{staffId}
    })
    .catch((err) => console.error("Token error:", err));

import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

const db1 = getFirestore();

async function notifyStaffBooking(customerName, service, date, time) {
    try {
        const snapshot = await db1.collection("staff_tokens").get();
        const tokens = snapshot.docs.map((doc) => doc.data().token);

        if (tokens.length === 0) {
            console.log("⚠️ No staff tokens found");
            return;
        }

        const message = {
            notification: {
                title: "💅 New Appointment Booking!",
                body: `${customerName} booked ${service} on ${date} at ${time}`,
            },
            tokens,
        };

        const response = await getMessaging().sendMulticast(message);
        console.log("✅ Notification sent to staff:", response.successCount, "successes");
    } catch (err) {
        console.error("🔥 FCM send error:", err);
    }
}

await notifyStaffBooking(customerName, service, date, time);

// --- FIREBASE INIT ---
import admin from "firebase-admin";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====== FIREBASE INIT ======
let db;
try {
    //const serviceAccountPath = path.resolve(__dirname, "atproj-a2634-firebase-adminsdk-s47ao-39ea66e97c.json");

    // ✅ Load service account from environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    if (!getApps().length) {
        initializeApp({
            credential: cert(serviceAccount),
        });
        console.log("✅ Firebase initialized successfully using service account.");
    } else {
        console.log("ℹ️ Firebase app already initialized, reusing existing app.");
    }

    db = getFirestore(getApp());
} catch (err) {
    console.error("🔥 Firebase initialization failed:", err);
}

// --- RESEND INIT ---
//const resend = new Resend(process.env.RESEND_API_KEY);

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
                html_message: html
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
app.get("/test-email", async (req, res) => {
    try {
        const serviceID = process.env.EMAILJS_SERVICE_ID;
        const templateID = process.env.EMAILJS_TEMPLATE_ID;
        const publicKey = process.env.EMAILJS_PUBLIC_KEY;

        if (!serviceID || !templateID || !publicKey) {
            throw new Error("Missing EmailJS environment variables");
        }

        const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                service_id: serviceID,
                template_id: templateID,
                user_id: publicKey,
                template_params: {
                    to_name: "Anvi",
                    to_email: "anvishett@gmail.com",
                    message: "This is a test email from Flamingo Nails backend!"
                }
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`EmailJS API failed: ${response.status} ${text}`);
        }

        res.send("✅ Test email sent successfully via EmailJS REST API!");
    } catch (err) {
        console.error("🔥 Email sending failed:", err);
        res.status(500).send(`Email sending failed: ${err.message}`);
    }
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

// --- Notify staff on WhatsApp via n8n ---
const n8nWebhook = process.env.N8N_WHATSAPP_WEBHOOK_URL;

try {
    await fetch(n8nWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            phone: "+918296584278", // staff phone
            message: `💅 New Booking Request!
Customer: ${customerName}
Service: ${service}
Date: ${date}
Time: ${time}
Email: ${customerEmail}`,
        }),
    });
    console.log("✅ WhatsApp notification sent via n8n");
} catch (err) {
    console.error("🔥 WhatsApp message failed:", err.message);
}


// --- STAFF CONFIRMS BOOKING ---
app.get("/confirm-booking/:id", async (req, res) => {
    const { id } = req.params;
    const ref = db.collection("bookings").doc(id);
    const booking = await ref.get();

    if (!booking.exists) return res.status(404).send("Booking not found");
    const data = booking.data();

    await ref.update({ status: "confirmed" });

    // ✅ Send confirmation email to the customer via EmailJS
    await sendEmail(
        data.customerEmail,
        "💅 Your Appointment is Confirmed!",
        `Hi ${data.customerName}, your appointment for ${data.service} on ${data.date} at ${data.time} has been confirmed.`,
        `
        <p>Hi ${data.customerName},</p>
        <p>Your appointment for <b>${data.service}</b> on <b>${data.date}</b> at <b>${data.time}</b> has been confirmed!</p>
        <br/>
        <a href="${process.env.BASE_URL}/final-confirm/${id}" 
           style="background:#28a745;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">👍 Confirm</a>
        &nbsp;&nbsp;
        <a href="${process.env.BASE_URL}/rebook/${id}" 
           style="background:#ffc107;color:#000;padding:10px 20px;border-radius:6px;text-decoration:none;">🔁 Rebook</a>
        `
    );

    res.send("✅ Booking confirmed and email sent to customer.");
});


// --- CUSTOMER FINAL CONFIRMATION ---
app.get("/final-confirm/:id", async (req, res) => {
    const { id } = req.params;
    const ref = db.collection("bookings").doc(id);
    const booking = await ref.get();

    if (!booking.exists) return res.status(404).send("Booking not found");

    await ref.update({ status: "final-confirmed" });

    // Optionally notify staff too
    await sendEmail(
        "anvishett@gmail.com",
        "🎉 Customer Final Confirmation",
        `Customer ${booking.data().customerName} has confirmed the appointment.`,
        `
        <h3>Final Confirmation</h3>
        <p>Customer <b>${booking.data().customerName}</b> has confirmed the appointment for:</p>
        <p><b>Service:</b> ${booking.data().service}</p>
        <p><b>Date:</b> ${booking.data().date}</p>
        <p><b>Time:</b> ${booking.data().time}</p>
        `
    );

    res.send("🎉 Booking confirmed by customer! It will now appear in MyBookings 💅");
});


// --- STAFF SUGGESTS NEW TIME ---
app.get("/rebook/:id", async (req, res) => {
    const { id } = req.params;
    const ref = db.collection("bookings").doc(id);
    const booking = await ref.get();

    if (!booking.exists) return res.status(404).send("Booking not found");

    await ref.update({ status: "rebook-suggested" });

    // ✅ Notify customer via EmailJS
    await sendEmail(
        booking.data().customerEmail,
        "🕓 New Time Suggested for Your Appointment",
        `Hi ${booking.data().customerName}, our staff will follow up to reschedule your ${booking.data().service} appointment.`,
        `
        <p>Hi ${booking.data().customerName},</p>
        <p>We’re suggesting a new time for your appointment for <b>${booking.data().service}</b>.</p>
        <p>Our team will reach out shortly to confirm a new time slot.</p>
        <br/>
        <a href="${process.env.BASE_URL}/book" 
           style="background:#007bff;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">📅 Rebook Now</a>
        `
    );

    res.send("🕓 Rebook status updated and email sent to customer.");
});

app.listen(3000, () =>
    console.log("✅ Secure Flamingo AI backend with Gmail email booking flow running on http://localhost:3000")
);
