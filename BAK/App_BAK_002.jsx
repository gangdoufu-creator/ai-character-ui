import { useState } from "react";

export default function App() {
  const [prompt, setPrompt] = useState("Light pink hair, pink eyes, pink and white, sakura leafs, vivid colors, white dress, paint splash, simple background, ray tracing, wavy hair");
  const [mainImage, setMainImage] = useState(null);
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);

    try {
      console.log("🔄 Starting generation process...");

      const response = await fetch("/Real8.json");
      if (!response.ok) throw new Error("❌ Failed to load Real8.json");

      const workflow = await response.json();
      console.log("✅ Loaded workflow:", workflow);

      if (workflow["14"]?.inputs) {
        workflow["14"].inputs.text = prompt;
        console.log("✏️ Prompt injected into node 14:", prompt);
      } else {
        throw new Error("❌ Node 14 not found or missing inputs");
      }

      if (workflow["5"]?.inputs) {
        const randomSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        workflow["5"].inputs.seed = randomSeed;
        console.log("🎲 Random seed set:", randomSeed);
      }

      const proxyUrl = "http://localhost:3001/generate-image";
      const res = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: workflow })
      });

      const data = await res.json();
      console.log("📥 ComfyUI /prompt response:", data);

      const queue_id = data?.queue_id;
      if (!queue_id) throw new Error("❌ No queue_id returned");

      const serverUrl = "http://localhost:3001";
      let imageURL = null;

      for (let i = 0; i < 60; i++) {
        const histRes = await fetch(`${serverUrl}/history/${queue_id}`);
        const histData = await histRes.json();

        console.log(`⏳ Poll ${i + 1}:`, histData);
        console.log("📦 Full poll data:", JSON.stringify(histData, null, 2));

        const outputs = Object.values(histData[queue_id]?.outputs || {});
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
        await new Promise((r) => setTimeout(r, 1000));
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

  const handleAddTag = (tag) => {
    setPrompt((prev) => (prev.includes(tag) ? prev : prev + ", " + tag));
  };

  const tagCategories = {
    Clothing: ["Elegant dress", "casual clothing", "underwear", "white panties", "naked"],
    Location: ["Indoor", "window", "outdoor", "riverside", "mountainside", "ocean view"],
    Position: ["Standing", "sitting", "lying", "bending over", "kneeling down"]
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="w-full p-12 bg-gray-800 text-center text-5xl font-bold">
        AI Image Generator
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 p-4"></div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
          <div className="w-[512px] h-[768px] flex items-center justify-center mb-4">
            {mainImage ? (
              <img
                src={mainImage}
                alt="Generated"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <img
                src="/Akemi_openingChar.png"
                alt="AI Character"
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>

          <div className="w-[512px] p-4 flex flex-col space-y-2">
            <textarea
              rows={3}
              className="w-full p-2 bg-gray-700 resize-none"
              placeholder="Describe your image..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full p-2 ${
                loading ? "bg-gray-600 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        <div className="w-64 p-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Prompt Tags</h2>
          {Object.entries(tagCategories).map(([category, tags]) => (
            <div key={category} className="mb-4">
              <h3 className="text-md font-semibold mb-1">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleAddTag(tag)}
                    className="text-sm bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <h2 className="text-xl font-bold mb-4 mt-8">History</h2>
          <div className="flex flex-col space-y-4">
            {variations.length === 0 ? (
              <p className="text-sm text-gray-400">No variations yet.</p>
            ) : (
              variations.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`variation-${idx}`}
                  className="rounded cursor-pointer hover:opacity-80"
                  onClick={() => setMainImage(img)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="w-full p-4 text-center text-sm text-gray-400">
        © 2025 AI Image Generator. All rights reserved.
      </div>
    </div>
  );
}
