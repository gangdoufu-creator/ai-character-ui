import { useState, useEffect } from "react";

export default function App() {
  console.log("🟢 App.jsx is running latest version");

  const [prompt, setPrompt] = useState("girl");
  const [mainImage, setMainImage] = useState(null);
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTags, setActiveTags] = useState(new Set());
  const [defaultTags, setDefaultTags] = useState(() => {
    return localStorage.getItem("defaultTags") ||
      "vibrant colours, dslr-evel detail, realistic hair, photoreal skin pores, canon eos r5, soft background bokeh, nikon, f1.4, pretty, beautiful, detailed face, real face, stunning, pale skin, shaven, detailed skin";
  });
  const [negativePrompt, setNegativePrompt] = useState("(worst quality:2), (low quality:2), (normal quality:2), lowres, bad anatomy, watermark, extra arms, CGI, 3d, anime, cartoon, plastic skin, shiny skin, low quality, blurry, extra limbs, extra arms, bad anatomy, ugly, plastic breasts, wet, hairy, streaks, streaky");

  const [showDevPanel, setShowDevPanel] = useState(false);

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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);

    try {
      console.log("🔄 Starting generation process...");
      console.log("🚀 Using defaultTags:", defaultTags);
      console.log("📝 User prompt:", prompt);
      console.log("🧠 Final combined prompt:", `${defaultTags}, ${prompt}`);

      const response = await fetch("/Real8.json");
      if (!response.ok) throw new Error("❌ Failed to load Real8.json");

      const workflow = await response.json();
      console.log("✅ Loaded workflow:", workflow);

      if (workflow["14"]?.inputs) {
        const finalPrompt = `${defaultTags}, ${prompt}`;
        workflow["14"].inputs.text = finalPrompt;
        console.log("✏️ Prompt injected into node 14:", finalPrompt);
      } else {
        throw new Error("❌ Node 14 not found or missing inputs");
      }

      if (workflow["2"]?.inputs) {
        workflow["2"].inputs.text = negativePrompt;
        console.log("🚫 Negative Prompt:", negativePrompt);
      }

      if (workflow["3"]?.inputs) {
        const randomSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        workflow["3"].inputs.seed = randomSeed;
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
      localStorage.removeItem("defaultTags");
    }
  };

  const handleToggleTag = (tag) => {
    setActiveTags(prev => {
      const newTags = new Set(prev);
      if (newTags.has(tag)) {
        newTags.delete(tag);
        setPrompt(prevPrompt => prevPrompt.replace(new RegExp(`\b${tag}\b,? ?`), '').trim().replace(/,\s*$/, ''));
      } else {
        newTags.add(tag);
        setPrompt(prev => prev.includes(tag) ? prev : prev + ", " + tag);
      }
      return newTags;
    });
  };

  const tagCategories = {
    Camera: ["Close", "Medium", "Wide"],
    HairColor: ["Black", "Light Pink", "Light Blue", "Blonde", "Brunette"],
    Clothing: ["Elegant dress", "casual clothing", "underwear", "white panties", "naked"],
    Location: ["Indoor", "window", "outdoor", "riverside", "mountainside", "ocean view"],
    Position: ["Standing", "sitting", "lying", "bending over", "kneeling down"]
  };

  return (
    <div className="flex flex-col h-screen bg-gray-200">
      <div className="w-full bg-gray-800 px-6 py-4 flex items-center gap-4 relative">
        <h1 className="text-4xl font-bold text-white whitespace-nowrap">AI Image Generator</h1>
        <textarea
          rows={1}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          className="flex-1 p-2 bg-gray-700 text-white border border-gray-600 rounded resize-none mr-[160px]"
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`absolute right-16 top-1/2 transform -translate-y-1/2 px-6 py-[11px] text-sm font-semibold text-white rounded ${loading ? "bg-gray-600" : "bg-indigo-600 hover:bg-indigo-700"}`}
        >
          {loading ? "Generating..." : "Get Lucky"}
        </button>
      </div>

      <button
        onClick={() => setShowBatchPanel(prev => !prev)}
        className="absolute right-4 top-[4%] transform -translate-y-1/2 text-white hover:text-gray-300 settings-icon"
        title="Batch Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10">
          <line x1="4" y1="5" x2="20" y2="5" />
          <circle cx="14" cy="5" r="1.5" fill="currentColor" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <circle cx="8" cy="12" r="1.5" fill="currentColor" />
          <line x1="4" y1="19" x2="20" y2="19" />
          <circle cx="17" cy="19" r="1.5" fill="currentColor" />
        </svg>
      </button>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-42 p-3 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Prompt Tags</h2>
          {Object.entries(tagCategories).map(([category, tags]) => (
            <div key={category} className="mb-4">
              <h3 className="text-md font-semibold mb-1">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className={`text-sm px-2 py-1 rounded ${
                      activeTags.has(tag)
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                    }`}
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
              <img
                src={mainImage}
                alt="Generated"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            ) : (
              <img
                src="/Akemi_openingChar.png"
                alt="AI Character"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            )}
          </div>
        </div>
        
        
        <div className="w-24 p-3 overflow-y-auto">
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
                  className="rounded cursor-pointer hover:opacity-80"
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

      <button
        className="fixed bottom-8 right-6 z-50 text-sm text-white bg-indigo-700 px-3 py-1 rounded shadow-lg hover:bg-indigo-600"
        onClick={() => setShowDevPanel((prev) => !prev)}
      >
        {showDevPanel ? "Hide Dev Panel" : "Show Dev Panel"}
      </button>
    </div>
  );
}
