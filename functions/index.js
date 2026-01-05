const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Proxies OpenAI requests so the API key never reaches the browser.
exports.openaiProxy = onRequest(
  {
    region: "us-central1",
    cors: true,
    secrets: ["OPENAI_API_KEY"],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.set("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
    }

    const openaiPath = req.path.replace(/^\/api\/openai/, "") || "/chat/completions";
    const targetUrl = `https://api.openai.com/v1${openaiPath}`;

    try {
      const payload = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});

      const openaiResponse = await fetch(targetUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: payload,
      });

      const text = await openaiResponse.text();
      res.status(openaiResponse.status);
      // Forward OpenAI headers that matter for client-side parsing.
      res.set("Content-Type", openaiResponse.headers.get("content-type") || "application/json");
      res.send(text);
    } catch (error) {
      logger.error("OpenAI proxy error", error);
      res.status(500).json({ error: "Failed to reach OpenAI" });
    }
  }
);
