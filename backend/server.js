// backend/server.js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const COMFY_API = 'https://lrkndlff2sfzkn-8188.proxy.runpod.net';

// Forward prompt to ComfyUI
app.post("/generate-image", async (req, res) => {
  try {
    console.log("📨 /generate-image hit");
    const prompt = req.body;
    console.log("📦 Forwarding workflow to ComfyUI...");

    const comfyRes = await fetch(`${COMFY_API}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prompt),
    });

    const data = await comfyRes.json();
    console.log("📥 ComfyUI /prompt response:", data);

    if (!data.prompt_id) {
      throw new Error("No prompt_id returned from ComfyUI");
    }

    // Send it back as queue_id to match frontend expectations
    res.json({ queue_id: data.prompt_id });

  } catch (err) {
    console.error("❌ Error in /generate-image:", err);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

// Forward history polling
app.get('/history/:queue_id', async (req, res) => {
  try {
    const response = await fetch(`${COMFY_API}/history/${req.params.queue_id}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('❌ Proxy error on /history:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Forward image viewing
app.get('/view', async (req, res) => {
  try {
    const filename = req.query.filename;
    const response = await fetch(`${COMFY_API}/view?filename=${filename}`);
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('❌ Proxy error on /view:', err);
    res.status(500).json({ error: 'Failed to load image' });
  }
});

// ✅ Don't forget this!
const PORT = 3001;
app.listen(PORT, () => console.log(`✅ Proxy server running at http://localhost:${PORT}`));

app.post('/move-to-input', async (req, res) => {
  const { filename } = req.body;
  const src = path.join('/workspace/ComfyUI/output', filename);
  const dest = path.join('/workspace/ComfyUI/input', filename);

  try {
    fs.copyFileSync(src, dest);
    console.log(`✅ Moved ${filename} to input folder`);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Failed to move file:', err);
    res.status(500).json({ error: 'File move failed' });
  }
});