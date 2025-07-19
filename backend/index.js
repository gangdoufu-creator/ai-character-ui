// ai-character-ui/backend/index.js

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = 3001;

const COMFYUI_URL = "https://dcnofne7nrfea3-8188.proxy.runpod.net";

app.use(cors());
app.use(express.json());

// POST /generate-image -> forwards prompt to ComfyUI
app.post("/generate-image", async (req, res) => {
  try {
    const payload = req.body;
    const comfyRes = await fetch(`${COMFYUI_URL}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await comfyRes.json();
    res.json(data); // typically contains { queue_id }
  } catch (err) {
    console.error("❌ Error sending prompt to ComfyUI:", err);
    res.status(500).json({ error: "Failed to contact ComfyUI" });
  }
});

// GET /history/:id -> poll image generation history
app.get("/history/:id", async (req, res) => {
  try {
    const historyRes = await fetch(`${COMFYUI_URL}/history/${req.params.id}`);
    const data = await historyRes.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Error retrieving history from ComfyUI:", err);
    res.status(500).json({ error: "Failed to retrieve history" });
  }
});

// GET /view?filename=... -> proxy ComfyUI image
app.get("/view", async (req, res) => {
  const filename = req.query.filename;
  if (!filename) return res.status(400).send("Missing filename");

  try {
    const imageRes = await fetch(`${COMFYUI_URL}/view?filename=${encodeURIComponent(filename)}`);
    const buffer = await imageRes.arrayBuffer();
    res.set("Content-Type", "image/png");
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("❌ Error fetching image from ComfyUI:", err);
    res.status(500).send("Failed to retrieve image");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend proxy server running at http://localhost:${PORT}`);
});
