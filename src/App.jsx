import { useState, useEffect } from "react";

export default function App() {
  console.log("🟢 App.jsx is running latest version");

  const [prompt, setPrompt] = useState("Beautiful Lady");
  const [mainImage, setMainImage] = useState(null);
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTags, setActiveTags] = useState(new Set());
  const [batchCount, setBatchCount] = useState(1);
  const [showBatchPanel, setShowBatchPanel] = useState(false);
  const [defaultTags, setDefaultTags] = useState(() => {
    return localStorage.getItem("defaultTags") ||
      "vibrant colours, dslr-evel detail, realistic hair, photoreal skin pores, canon eos r5, soft background bokeh, nikon, f1.4, pretty, beautiful, detailed face, real face, stunning, pale skin, shaven, detailed skin";
  });
  const [negativePrompt, setNegativePrompt] = useState("(worst quality:2), (low quality:2), (normal quality:2), lowres, bad anatomy, watermark, extra arms, CGI, 3d, anime, cartoon, plastic skin, shiny skin, low quality, blurry, extra limbs, extra arms, bad anatomy, ugly, plastic breasts, wet, hairy, streaks, streaky");
  const [showDevPanel, setShowDevPanel] = useState(false);

  const workflowConfigs = {
    image: {
      file: "/Real8.json",
      promptNode: "14",
      negativeNode: "2",
      seedNode: "3",
      batchNode: "4",
    },
    video: {
      file: "/wan_Image2Video.json",
      promptNode: "105",
      negativeNode: "115",
      seedNode: "108"
    },
  };

  useEffect(() => {
    const toggleDevPanel = (e) => {
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        setShowDevPanel((prev) => !prev);
      }
    };
    window.addEventListener("keydown", toggleDevPanel);
    return () => window.removeEventListener("keydown", toggleDevPanel);
  }, []);

  const tagCategories = {
    Camera: ["Close", "Medium", "Wide"],
    HairColor: ["Black", "Light Pink", "Light Blue", "Blonde", "Brunette"],
    Clothing: ["Elegant dress", "casual clothing", "underwear", "white panties", "naked"],
    Location: ["Indoor", "window", "outdoor", "riverside", "mountainside", "ocean view"],
    Position: ["Standing", "sitting", "lying", "bending over", "kneeling down"]
  };

  const handleToggleTag = (tag) => {
    setActiveTags(prev => {
      const newTags = new Set(prev);
      if (newTags.has(tag)) {
        newTags.delete(tag);
        setPrompt(prevPrompt => prevPrompt.replace(new RegExp(`\\b${tag}\\b,? ?`), '').trim().replace(/,\s*$/, ''));
      } else {
        newTags.add(tag);
        setPrompt(prev => prev.includes(tag) ? prev : prev + ", " + tag);
      }
      return newTags;
    });
  };

  const handleGenerate = async (type = "image") => {
    if (!prompt.trim()) return;
    if (type === "video" && !mainImage) {
      alert("Please generate or select an image first.");
      return;
    }

    setLoading(true);
    try {
      const config = workflowConfigs[type];
      if (!config) throw new Error(`❌ Invalid type: ${type}`);
      const response = await fetch(config.file);
      console.log("📥 Fetching workflow from:", config.file);

      if (!response.ok) throw new Error("❌ Failed to load workflow file");

      const workflow = await response.json();
      const finalPrompt = `${defaultTags}, ${prompt}`;

      if (config.promptNode && workflow[config.promptNode]?.inputs) {
        workflow[config.promptNode].inputs.text = finalPrompt;
        console.log("✏️ Prompt injected into node", config.promptNode, ":", finalPrompt);
      } else {
        throw new Error(`❌ Node ${config.promptNode} not found or missing inputs`);
      }

      if (config.negativeNode && workflow[config.negativeNode]?.inputs) {
        workflow[config.negativeNode].inputs.text = negativePrompt;
        console.log("🚫 Negative Prompt:", negativePrompt);
      }

      if (config.seedNode && workflow[config.seedNode]?.inputs) {
        const randomSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        workflow[config.seedNode].inputs.seed = randomSeed;
        console.log("🎲 Random seed set:", randomSeed);
      }

      if (type === "image" && config.batchNode && workflow[config.batchNode]?.inputs) {
        workflow[config.batchNode].inputs.batch_size = batchCount;
        console.log("📦 Batch count set:", batchCount);
      }

      const proxyUrl = "http://localhost:3001/generate-image";
      const res = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: workflow, image: type === "video" ? mainImage : undefined })
      });

      const data = await res.json();
      console.log("📥 ComfyUI /prompt response:", data);

      const queue_id = data?.queue_id;
      if (!queue_id) throw new Error("❌ No queue_id returned");

      const serverUrl = "http://localhost:3001";
      let batchMedia = [];

      for (let i = 0; i < 60; i++) {
        const histRes = await fetch(`${serverUrl}/history/${queue_id}`);
        const histData = await histRes.json();
        const outputs = Object.values(histData[queue_id]?.outputs || {});

        for (const output of outputs) {
          if (output?.images) {
            const urls = output.images.map((img) => `${serverUrl}/view?filename=${img.filename}`);
            batchMedia.push(...urls);
          }
          if (output?.videos) {
            const urls = output.videos.map((vid) => `${serverUrl}/view?filename=${vid.filename}`);
            batchMedia.push(...urls);
          }
        }

        if (batchMedia.length > 0) break;
        await new Promise((r) => setTimeout(r, 1000));
      }

      if (batchMedia.length > 0) {
        console.log("✅ Batch media:", batchMedia);
        setMainImage(batchMedia[0]);
        setVariations((prev) => [...batchMedia, ...prev]);
      } else {
        alert("No media returned from ComfyUI after polling.");
      }
    } catch (err) {
      console.error("❌ Error in handleGenerate:", err);
      alert("Failed to generate media.");
    } finally {
      setLoading(false);
      localStorage.removeItem("defaultTags");
    }
  };


  return (
    <div className="flex flex-col h-screen bg-gray-200">
      <div className="w-full bg-gray-800 px-6 py-4 flex items-center gap-6 relative">
        <h1 className="text-4xl font-bold text-white whitespace-nowrap">Kissme.ai</h1>
        <textarea
          rows={1}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          className="flex-1 p-2 bg-gray-700 text-white border border-gray-600 rounded resize-none mr-[160px]"
        />
        <button
          onClick={() => handleGenerate("image")}
          disabled={loading}
          className={`absolute right-16 top-1/2 transform -translate-y-1/2 px-6 py-[11px] text-sm font-semibold text-white rounded ${loading ? "bg-gray-600" : "bg-indigo-600 hover:bg-indigo-700"}`}
        >
          {loading ? "Generating..." : "Get Lucky"}
        </button>
      </div>

      <button
        onClick={() => setShowBatchPanel(prev => !prev)}
        className="absolute right-4 top-[38px] transform -translate-y-1/2 text-white hover:text-gray-300 settings-icon"
        title="Batch Settings"
      >
        ⚙️
      </button>

      {showBatchPanel && (
        <div className="absolute right-4 top-[90px] bg-gray-700 shadow-lg border border-gray-300 rounded p-3 z-50 text-sm w-48">
          <label className="block mb-2 font-semibold text-white">Iterations</label>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={batchCount}
            onChange={(e) => setBatchCount(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-sm text-white mt-1 text-right">
            {batchCount} image{batchCount > 1 ? "s" : ""}
          </div>
        </div>
      )}

      <button
        onClick={() => handleGenerate("video")}
        disabled={loading}
        className={`w-full p-2 ${loading ? "bg-gray-600 cursor-not-allowed" : "bg-pink-600 hover:bg-pink-700"}`}
      >
        {loading ? "Generating Video..." : "Generate Video"}
      </button>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-42 p-3 overflow-y-auto bg-gray-100">
          <h2 className="text-xl font-bold mb-4">Prompt Tags</h2>
          {Object.entries(tagCategories).map(([category, tags]) => (
            <div key={category} className="mb-4">
              <h3 className="text-md font-semibold mb-1">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className={`text-sm px-2 py-1 rounded ${activeTags.has(tag) ? "bg-indigo-600 text-white" : "bg-gray-700 text-white hover:bg-gray-600"}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-start p-4 relative">
          <div className="w-[512px] h-[768px] flex items-center justify-center mt-4">
            {mainImage ? (
              <img src={mainImage} alt="Generated" className="max-h-full max-w-full object-contain rounded-lg" />
            ) : (
              <img src="/Akemi_openingChar.png" alt="AI Character" className="max-h-full max-w-full object-contain rounded-lg" />
            )}
          </div>
        </div>

        <div className="w-48 p-3 overflow-y-auto bg-gray-100">
          <h2 className="text-xl font-bold mb-4">Gallery</h2>
          <div className="flex flex-col space-y-4">
            {variations.length === 0 ? (
              <p className="text-sm text-gray-500">No variations yet.</p>
            ) : (
              variations.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`variation-${idx}`}
                  className="rounded cursor-pointer transition-transform duration-200 hover:scale-110 hover:opacity-90"
                  onClick={() => setMainImage(img)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {showDevPanel && (
        <div className="fixed bottom-4 right-4 p-4 bg-gray-800 border border-gray-600 rounded shadow text-left z-50 w-80">
          <h3 className="text-lg font-bold mb-2">🛠 Dev Prompt Settings</h3>
          <textarea
            rows={4}
            value={defaultTags}
            onChange={(e) => setDefaultTags(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded resize-none mb-2"
          />
        </div>
      )}
    </div>
  );
}
