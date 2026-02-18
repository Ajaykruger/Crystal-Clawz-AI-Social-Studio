<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Crystal Clawz AI Social Studio

AI-powered social media content creator for nail brands — compliant, brand-aligned posts with Firebase-backed team collaboration.

## Quick Start

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment template and fill in your keys:
   ```bash
   cp .env.local.example .env.local
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

---

## Environment Setup

The app needs two sets of credentials in `.env.local`:

| Variable | Where to get it |
|---|---|
| `VITE_GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `VITE_FIREBASE_*` | Firebase Console → Project Settings → Your apps → Web |

---

## Firebase Setup (one-time)

### 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** and follow the wizard
3. Click the **</>** (Web) icon, register the app, then copy the `firebaseConfig` values into `.env.local`

### 2. Enable Authentication

1. In the Firebase Console, go to **Authentication → Get started**
2. Enable the **Google** sign-in provider
3. Enable the **Email/Password** sign-in provider
4. Go to **Authentication → Users** and add your team members' email addresses

### 3. Set up Firestore

1. Go to **Firestore Database → Create database**
2. Choose **Start in production mode**
3. Select a region close to you (e.g. `europe-west1` for South Africa)
4. After creating the database, go to **Rules** and replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workspace/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This lets signed-in team members read and write shared workspace data, and blocks everyone else.

---

## How It Works

| Layer | Technology |
|---|---|
| AI content generation | Google Gemini via `@google/genai` |
| Authentication | Firebase Auth (Google + Email/Password) |
| Shared data | Firestore — single `workspace/crystalclawz` document |
| Frontend | React + Vite + Tailwind CSS |

All drafts, calendar posts, and review posts sync automatically to Firestore, so the whole team sees the same data in real time.

---

View the app in AI Studio: https://ai.studio/apps/drive/1Db-jPhx0zDv_EpHTXHhiK-oIGEW3QFGF
