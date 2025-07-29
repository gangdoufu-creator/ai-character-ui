// MainPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, SlidersHorizontal } from "lucide-react";

export default function MainPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const settingsref = useRef();
  const selectedGirl = location.state;

  const [mainImage, setMainImage] = useState(null);
  const [prompt, setPrompt] = useState(
    selectedGirl?.prompt || localStorage.getItem("initialPrompt") || "Beautiful Lady"
  );
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTags, setActiveTags] = useState(new Set());
  const [batchCount, setBatchCount] = useState(1);
  const [showBatchPanel, setShowBatchPanel] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [realismLevel, setRealismLevel] = useState(2);
  const [realism, setRealism] = useState(3);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [defaultTags, setDefaultTags] = useState(() =>
    localStorage.getItem("defaultTags") ||
    "vibrant colours, dslr-level detail, realistic hair, photoreal skin pores, canon eos r5, soft background bokeh, nikon, f1.4, pretty, beautiful, detailed face, real face, stunning, pale skin, shaven, detailed skin"
  );

  const tagCategories = {
    Style: ["cinematic", "hdr", "bokeh", "sharp focus"],
    Mood: ["happy", "romantic", "mysterious"],
    Detail: ["freckles", "wet skin", "dim lighting"]
  };

  const handleToggleTag = (tag) => {
    setActiveTags((prev) => {
      const updated = new Set(prev);
      updated.has(tag) ? updated.delete(tag) : updated.add(tag);
      return updated;
    });
  };

  const workflowConfigs = {
    image: {
      file: "/japaneseStyleRealistic_v20.json",
      promptNode: "14",
      negativeNode: "2",
      seedNode: "3",
      batchNode: "4",
      filename: "17"
    },
    video: {
      file: "/wan_Image2VideoFAST.json",
      promptNode: "105",
      negativeNode: "107",
      seedNode: "108",
      imageInputNode: "164",
    },
  };
  const realismSettings = {
    1: {
      label: "Cartoon",
      model: "animerge_v50.safetensors",
      cfg: 8,
      steps: 50,
    },
    2: {
      label: "Stylized",
      model: "meinaunreal_v5.safetensors",
      cfg: 8,
      steps: 50,
    },
    3: {
      label: "Balanced",
      model: "animesh_PrunedV22.safetensors",
      cfg: 8,
      steps: 50,
    },
    4: {
      label: "Semi-Realistic",
      model: "hellorealistic_V11.safetensors",
      cfg: 8,
      steps: 50,
    },
    5: {
      label: "Photoreal",
      model: "realcartoon3d_v8.safetensors",
      cfg: 8,
      steps: 50,
    },
  };

  useEffect(() => {
    if (selectedGirl?.image || selectedGirl?.video) {
      setMainImage(selectedGirl.image || selectedGirl.video);
    }
  }, [selectedGirl]);

  const extractFilename = (url) => {
    const params = new URL(url).searchParams;
    return params.get("filename");
  };

  const handleGenerate = async (type = "image") => {
    const selectedRealism = realismSettings[realismLevel];
    
    console.log("⚙️ CFG:", selectedRealism.cfg, "| Steps:", selectedRealism.steps);
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
      const negativePrompt =
        "(worst quality:2), (low quality:2), (normal quality:2), lowres, bad anatomy, watermark, extra arms, CGI, 3d, anime, cartoon, plastic skin, shiny skin, low quality, blurry, extra limbs, extra arms, bad anatomy, ugly, plastic breasts, wet, hairy, streaks, streaky";

      if (config.promptNode && workflow[config.promptNode]?.inputs) {
        workflow[config.promptNode].inputs.text = finalPrompt;
      }

      if (config.negativeNode && workflow[config.negativeNode]?.inputs) {
        workflow[config.negativeNode].inputs.text = negativePrompt;
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

      if (type === "video") {
        const filename = extractFilename(mainImage);
        await fetch("http://localhost:3001/move-to-input", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename }),
        });
        if (config.imageInputNode && workflow[config.imageInputNode]?.inputs) {
          workflow[config.imageInputNode].inputs.image = `${filename} [output]`;
        }
      }

      // Optional: inject checkpoint model, cfg, steps if node IDs are known
      for (const node of Object.values(workflow)) {
        if (node.class_type === "CheckpointLoaderSimple") {
          node.inputs.ckpt_name = selectedRealism.model;
        }
        if (node.class_type === "KSampler") {
          if (node.inputs.cfg) node.inputs.cfg = selectedRealism.cfg;
          if (node.inputs.steps) node.inputs.steps = selectedRealism.steps;
        }
      }


      const res = await fetch("http://localhost:3001/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: workflow, image: type === "video" ? mainImage : undefined }),
      });


      console.log("🎯 Realism level selected:", realismLevel);
      console.log("📦 Injecting checkpoint:", selectedRealism.model);
      console.log("⚙️ CFG:", selectedRealism.cfg, "| Steps:", selectedRealism.steps);
      

      const data = await res.json();
      const queue_id = data?.queue_id;
      if (!queue_id) throw new Error("❌ No queue_id returned");

      const serverUrl = "http://localhost:3001";
      let batchMedia = [];

      for (let i = 0; i < 1999; i++) {
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col">
      {/* header + prompt + Get Lucky + Batch */}
      <div className="w-full bg-black px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-6 relative">
        <h1 onClick={() => navigate("/")} className="relative left-[4px] text-3xl font-bold text-white cursor-pointer">
          Kissme.ai
        </h1>
        <div className="flex flex-1 mx-2 items-center gap-4 pr-0 ml-[18px]">
          <textarea
            rows={1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your dream prompt..."
            className="flex-1 p-2 bg-gray-700 text-white border border-gray-600 rounded resize-none"
          />
          <button
            onClick={() => handleGenerate("image")}
            disabled={loading}
            className={`px-6 py-[11px] text-sm font-semibold text-white rounded ${
              loading ? "bg-gray-600 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Generating..." : "Get Lucky"}
          </button>
          <button
            onClick={() => setShowBatchPanel((prev) => !prev)}
            className="relative top-[1px] text-white hover:text-gray-300 p-2 rounded-full bg-gray-700 hover:bg-gray-600"
            title="Batch Settings"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate("/account")}
            className="relative right-[0px] top-[1px] text-white hover:text-gray-300 p-2 rounded-full bg-gray-700 hover:bg-gray-600"
            title="Your Account"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showBatchPanel && (
        <div
          ref={settingsref}
          className="absolute right-6 top-[90px] bg-gray-700 shadow-lg border border-gray-300 rounded p-3 z-50 text-sm w-48"
        >
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

      <div className="flex flex-1 overflow-hidden">
        {showLeftPanel && (
          <div className={`w-72 p-3 overflow-y-auto bg-gradient-to-b from-gray-900 to-black relative ${showLeftPanel ? "block" : "hidden"} hidden lg:block`}>            
            <button 
              onClick={() => setShowLeftPanel(false)}
              className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-gray-700 text-white px-1 py-0.5 text-xs rounded-r shadow"
            >
              ✖
            </button>
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
            <div className="mt-6">   
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Cartoony</span>
                <span>Photorealistic</span>
              </div>           
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={realismLevel}
                onChange={(e) => setRealismLevel(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          
        )}

        
        <div className="flex-1 flex flex-col items-center justify-start p-0 relative bg-gray-800 overflow-hidden max-h-screen">
          <div className="w-full max-w-[512px] aspect-[2/3] flex items-center justify-center mt-4">
            {mainImage &&
              (mainImage.endsWith(".mp4") ? (
                <video src={mainImage} controls autoPlay loop muted className="w-full h-full object-contain rounded-lg" />
              ) : (
                <img src={mainImage} alt="Selected" className="w-full h-full object-contain rounded-lg" />
              ))}
          </div>
          <button
            onClick={() => handleGenerate("video")}
            disabled={loading}
            className={`mt-0 w-full max-w-[512px] p-2 text-white rounded-t-none rounded-b-lg text-sm font-semibold ${
              loading ? "bg-gray-600 cursor-not-allowed" : "bg-gray-600 hover:bg-gray-800"
            }`}
          >
            {loading ? "Generating Video..." : "Generate Video"}
          </button>
        </div>

        {showRightPanel && (
          <div className={`overflow-y-auto bg-gradient-to-b from-gray-900 to-black relative ${showRightPanel ? "block" : "hidden"} w-24 sm:w-36 md:w-60 lg:w-72 p-2 sm:p-3`}>
            <button
              onClick={() => setShowRightPanel(false)}
              className="absolute -left-3 top-1/2 transform -translate-y-1/2 bg-gray-700 text-white px-1 py-0.5 text-xs rounded-l shadow"
            >
              ✖
            </button>
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
                    className="rounded cursor-pointer w-16 sm:w-24 md:w-32 lg:w-40 transition-transform duration-200 hover:scale-105 hover:opacity-90"
                    onClick={() => setMainImage(img)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {!showLeftPanel && (
        <button
          onClick={() => setShowLeftPanel(true)}
          title="Show sidebar"
          className="fixed top-1/2 left-0 transform -translate-y-1/2 bg-gray-700 text-white px-2 py-1 rounded-r-md hover:bg-gray-600 transition-all duration-150 z-50"
        >
          ▶
        </button>
      )}

      {!showRightPanel && (
        <button
          onClick={() => setShowRightPanel(true)}
          title="Show gallery"
          className="fixed top-1/2 right-0 transform -translate-y-1/2 bg-gray-700 text-white px-2 py-1 rounded-l-md hover:bg-gray-600 transition-all duration-150 z-50"
        >
          ◀
        </button>
      )}
    </div>
  );
}
