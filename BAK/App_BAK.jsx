import { useState } from "react";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [mainImage, setMainImage] = useState(null);
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);

    try {
      console.log("🔄 Starting generation process...");

      // Load external workflow
      const response = await fetch("/Real8.json");
      if (!response.ok) throw new Error("❌ Failed to load Real8.json");

      const workflow = await response.json();
      console.log("✅ Loaded workflow:", workflow);

      // Inject prompt into node 14
      if (workflow["14"]?.inputs) {
        workflow["14"].inputs.text = prompt;
        console.log("✏️ Prompt injected into node 14:", prompt);
      } else {
        throw new Error("❌ Node 14 not found or missing inputs");
      }

      // Send to backend
      const proxyUrl = "http://localhost:3001/generate-image";
      const res = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body: JSON.stringify(workflow)({ prompt: workflow })
      });

      const data = await res.json();
      console.log("📥 ComfyUI /prompt response:", data);

      const queue_id = data?.queue_id;
      if (!queue_id) throw new Error("❌ No queue_id returned");

      const serverUrl = "http://localhost:3001";
      let imageURL = null;

      // Polling for result
      for (let i = 0; i < 60; i++) {
        const histRes = await fetch(`${serverUrl}/history/${queue_id}`);
        const histData = await histRes.json();

        console.log(`⏳ Poll ${i + 1}:`, histData);

        const outputs = Object.values(histData.outputs || {});
        for (const output of outputs) {
          const images = output?.images;
          if (images?.[0]?.filename) {
            const filename = images[0].filename;
            console.log("🖼️ Found image filename:", filename);
            imageURL = `${serverUrl}/view?filename=${filename}`;
            break;
          }
        }

        if (imageURL) break;
        await new Promise((r) => setTimeout(r, 1000)); // 1s wait
      }

      if (imageURL) {
        console.log("✅ Image URL:", imageURL);
        setMainImage(imageURL);
        setVariations((prev) => [imageURL, ...prev]);
      } else {
        alert("No image returned from ComfyUI after polling.");
      }
    } catch (err) {
      console.error("❌ Error in handleGenerate:", err);
      alert("Failed to generate image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Prompt Sidebar */}
      <div className="w-64 p-4 bg-gray-800 border-r border-gray-700 flex flex-col space-y-4">
        <h2 className="text-xl font-bold">Prompt</h2>
        <textarea
          rows={6}
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 resize-none"
          placeholder="Describe your image..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`w-full p-2 rounded ${
            loading ? "bg-gray-600 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {/* Main Image Display */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-[512px] h-[768px] bg-gray-700 rounded shadow-lg flex items-center justify-center">
          {mainImage ? (
            <img
              src={mainImage}
              alt="Generated"
              className="max-h-full max-w-full object-contain rounded"
            />
          ) : (
            <span className="text-gray-400">No image yet</span>
          )}
        </div>
      </div>

      {/* History Sidebar */}
      <div className="w-64 p-4 bg-gray-800 border-l border-gray-700 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">History</h2>
        <div className="flex flex-col space-y-4">
          {variations.length === 0 ? (
            <p className="text-sm text-gray-400">No variations yet.</p>
          ) : (
            variations.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`variation-${idx}`}
                className="rounded border border-gray-600 cursor-pointer hover:opacity-80"
                onClick={() => setMainImage(img)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
