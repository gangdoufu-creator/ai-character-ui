// backend/server.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import 'dotenv/config';

const app = express();

// Load environment variables (if using .env)
const PORT = process.env.PORT || 3001;
const COMFY_API = process.env.COMFY_API || "https://4yhjpqfavudtks-8188.proxy.runpod.net";

// Middleware
app.use(cors());
app.use(express.json());

// --- Utility: Forward requests to ComfyUI ---
async function forwardToComfyUI(endpoint, options = {}) {
  try {
    const response = await fetch(`${COMFY_API}${endpoint}`, options);
    if (!response.ok) throw new Error(`ComfyUI request failed: ${response.status}`);
    return response;
  } catch (error) {
    console.error(`❌ Error forwarding to ComfyUI (${endpoint}):`, error);
    throw error;
  }
}

// --- Routes ---

// POST: Forward workflow to ComfyUI
app.post("/generate-image", async (req, res) => {
  try {
    console.log("📨 /generate-image hit");
    console.log("📦 Forwarding workflow to ComfyUI...");

    const comfyRes = await forwardToComfyUI("/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await comfyRes.json();
    console.log("📥 ComfyUI /prompt response:", data);

    if (!data.prompt_id) throw new Error("No prompt_id returned from ComfyUI");

    // Send it back as queue_id to match frontend expectations
    res.json({ queue_id: data.prompt_id });
  } catch (err) {
    console.error("❌ Error in /generate-image:", err);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

// GET: Poll for history updates
app.get("/history/:queue_id", async (req, res) => {
  try {
    const comfyRes = await forwardToComfyUI(`/history/${req.params.queue_id}`);
    res.json(await comfyRes.json());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// GET: Fetch image
app.get("/view", async (req, res) => {
  try {
    const filename = req.query.filename;
    if (!filename) throw new Error("Missing filename query parameter");

    const comfyRes = await forwardToComfyUI(`/view?filename=${filename}`);
    const buffer = await comfyRes.arrayBuffer();

    res.setHeader("Content-Type", "image/png");
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("❌ Proxy error on /view:", err);
    res.status(500).json({ error: "Failed to load image" });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`✅ Proxy server running at http://localhost:${PORT}`);
  console.log(`🔗 Forwarding requests to: ${COMFY_API}`);
});
