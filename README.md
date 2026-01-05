<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1618AZdh-F_F9prtozlAYqKXF3aQNtHq7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `VITE_OPENAI_API_KEY` in [.env.local](.env.local) to your OpenAI API key (the app uses the low-cost `gpt-5-nano` model). For local dev, requests are proxied through Vite at `/api/openai` so your key never sits in the browser.
3. Run the app:
   `npm run dev`

## Firebase Function Proxy (keeps your OpenAI key server-side)

1. Set the secret for the function (one-time):
   `firebase functions:secrets:set OPENAI_API_KEY`
2. Deploy the proxy:
   `firebase deploy --only functions`
3. Hosting rewrite is already configured so `/api/openai/**` routes to the function.
4. For local emulators, create `functions/.env.local` with `OPENAI_API_KEY=your_key` and run:
   `npm run serve --prefix functions`
