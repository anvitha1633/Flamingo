# FlamingoNails-App


Mobile app prototype for Flamingo Nails (Flamingo Nails & Beauty). Built with Expo (React Native), Firebase (Auth + Firestore) and a minimal Node backend to proxy OpenAI requests for an AI chat assistant.


This repo is a prototype ready to be copied into a GitHub repository. It contains client code (Expo), config placeholders, and a small server folder with a Node Express app you can deploy as a serverless function.


## What’s included
- Expo React Native app (single-file prototype `App.js`) with:
- Email/password authentication (Firebase Auth)
- Service catalog and booking flow (stores bookings to Firestore)
- AI Chat Assistant UI that calls a backend endpoint to interact with OpenAI and optionally create bookings
- `server/server.js` — Node/Express example for `/ai-chat` endpoint that forwards conversation to OpenAI and returns structured actions.


## Quick setup (client)
1. Install Expo CLI (optional): `npm install -g expo-cli` or use `npx expo`.
2. Copy files into a new folder and run `npm install`.
3. Replace `firebaseConfig.js` placeholders with your Firebase project credentials.
4. Deploy the backend (suggested: Vercel, Netlify Functions, Heroku) and set `OPENAI_API_KEY` env var.
5. Replace the `AI_BACKEND_URL` constant inside `App.js` (or update to your deployed endpoint).
6. Start the app: `npx expo start`.


## Quick setup (server)
1. `cd server`
2. `npm install`
3. Set environment variable `OPENAI_API_KEY`.
4. `node server.js` (for local testing)


## Security notes
- Never embed your OpenAI API key or Firebase admin credentials in the mobile app. Keep them server-side.
- Configure Firestore security rules before switching to production.


## Next steps
- Replace the simple text date/time fields with a calendar/time picker.
- Add real service images (pull from Flamingo Instagram media).
- Add admin dashboard to manage/confirm bookings.


Enjoy — copy to GitHub and share the repo URL when ready!