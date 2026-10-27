# Yonja

**Report it, clean it, prove it.** Yonja turns every clean-up on Uganda's National Cleaning
Days into a verified, mapped record. Residents report a waste spot, prove it was cleaned with
before/after photos that Gemini checks, and division officers see the results live.

Built for the Pre-DevFest Hackathon Kampala 2026 (SDG 11, with SDGs 3, 6 and 12).

## Stack

Next.js 16 (static export) · Firestore · Firebase AI Logic (Gemini) · Google Maps ·
Open-Meteo · Firebase Hosting

## Run it

```bash
pnpm install
pnpm dev
```

One-time Firebase console setup for project `yonja-5b8de`:

1. Firestore → Create database (test mode).
2. AI Logic → Get started → Gemini Developer API.

## Deploy

```bash
firebase login
pnpm ship
```

## Checks

```bash
pnpm verify
```
