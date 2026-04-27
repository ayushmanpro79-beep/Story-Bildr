# Story-Bildr

A free hosted Next.js builder for generating themed serial-novel website folders. The generated websites include a PDF reader, Supabase-backed episode uploads, and a password-protected Writer's Studio.

## Run Locally

```bash
npm install
npm run dev
```

Optional AI generation:

```bash
cp .env.example .env.local
```

Then put your real OpenAI key inside `.env.local`:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.4-mini
```

Without an API key, Story-Bildr still works using a polished local fallback theme.

## Deploy As A Web App

Deploy the folder to Vercel as a Next.js app. Add these environment variables in the Vercel project settings:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Keep the OpenAI key server-side only. Do not paste it into generated websites or public client code.
