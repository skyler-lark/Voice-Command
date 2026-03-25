# AI Voice Command App

Next.js app for audio recorder/upload to Supabase with Tailwind UI.

## Setup

```bash
cd "/Users/sky/Documents/AI voice command app"

# install Node/npm if missing (macOS):
# brew install node

npm create next-app@latest ai-voice-upload --typescript --tailwind --eslint --app --use-npm --yes
cd ai-voice-upload
npm install @supabase/supabase-js
```

## Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://osulzxvpydeckgfhaznx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_mFlXY66HkfwTAXFMd6IDgA_MmOIYu_b
```

## Start

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Supabase

- Bucket: `uploads`
- Storage policy: allow public insert from anon user (or auth user)
- CORS: include `http://localhost:3000`

## Color scheme

- `primary`: #439c84
- `secondary`: #8c6bed
- `surface`: #050607
- text/containers use near-black + white

## Notes

- Use Chrome/Edge/Firefox for stable MediaRecorder support.
- If `Failed to fetch`, ensure app is served over HTTP, not `file://`.
