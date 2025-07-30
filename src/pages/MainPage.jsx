// MainPage.jsx

import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, SlidersHorizontal } from "lucide-react";
import { workflowConfigs } from "../config/workflowConfig";
import { tagCategories, realismPrompts, nudityPrompts, breastSizePrompts, realismSettings } from "../config/promptConfig";
import { buildFullPrompt, buildNegativePrompt } from "../utils/promptUtils";
import { sendWorkflowAndPoll, extractFilename } from "../utils/workflowUtils";

export default function MainPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const settingsref = useRef();
  const selectedGirl = location.state;
  const [mainImage, setMainImage] = useState(null);
  const [prompt, setPrompt] = useState( selectedGirl?.prompt || localStorage.getItem("initialPrompt") || "Beautiful Lady" );
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTags, setActiveTags] = useState(new Set());
  const [batchCount, setBatchCount] = useState(1);
  const [showBatchPanel, setShowBatchPanel] = useState(false);
  const [realismLevel, setRealismLevel] = useState(2);
  const [breastSizeLevel, setBreastSizeLevel] = useState(2);
  const [nudityLevel, setNudityLevel] = useState(3);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [defaultTags, setDefaultTags] = useState(() => localStorage.getItem("defaultTags") || "");

  const handleToggleTag = (tag) => {
    setActiveTags((prev) => {
      const updated = new Set(prev);
      updated.has(tag) ? updated.delete(tag) : updated.add(tag);
      return updated;
    });
  };

  useEffect(() => {
    if (selectedGirl?.image || selectedGirl?.video) {
      setMainImage(selectedGirl.image || selectedGirl.video);
    }
  }, [selectedGirl]);

  const handleGenerate = async (type = "image") => {
    if (!prompt.trim()) return;

    if (type === "video" && !mainImage) {
      alert("Please generate or select an image first.");
      return;
    }

    // Build prompts using helper functions
    const fullPrompt = buildFullPrompt({
      defaultTags,
      prompt,
      realismLevel,
      nudityLevel,
      breastSizeLevel,
      activeTags,
    });

    const dynamicNegativePrompt = buildNegativePrompt({
      realismLevel,
      nudityLevel,
      breastSizeLevel,
    });

    // Access for debug logging
    const nudity = nudityPrompts[nudityLevel];
    const breastSize = breastSizePrompts[breastSizeLevel];

    setLoading(true);

    try {
      const config = workflowConfigs[type];
      if (!config) throw new Error(`❌ Invalid type: ${type}`);

      console.log("🛠️ Using workflow:", config.file);

      // Load workflow template
      const response = await fetch(config.file);
      if (!response.ok) throw new Error("❌ Failed to load workflow file");
      const baseWorkflow = await response.json();

      // Model selection
      const selectedRealism = realismSettings[realismLevel];
      const randomModel =
        selectedRealism.model[
          Math.floor(Math.random() * selectedRealism.model.length)
        ];

      console.log("🎯 Realism Level:", realismLevel, "| Checkpoint:", randomModel);
      console.log("📝 Final Prompt Sent:", fullPrompt);
      console.log("👗 Nudity Slider:", nudityLevel, "| Tags:", nudity.pos);
      console.log("👙 Breast Size Slider:", breastSizeLevel, "| Tags:", breastSize.pos);

      // Handle batch requests one at a time
      for (let i = 0; i < batchCount; i++) {
        const workflow = JSON.parse(JSON.stringify(baseWorkflow));

        // Inject model + sampler settings
        for (const node of Object.values(workflow)) {
          if (node.class_type === "CheckpointLoaderSimple") {
            node.inputs.ckpt_name = randomModel;
          }
          if (node.class_type === "KSampler") {
            node.inputs.cfg = selectedRealism.cfg;
            node.inputs.steps = selectedRealism.steps;
          }
        }

        // Inject prompt text
        if (config.promptNode && workflow[config.promptNode]?.inputs) {
          workflow[config.promptNode].inputs.text = fullPrompt;
        }
        if (config.negativeNode && workflow[config.negativeNode]?.inputs) {
          workflow[config.negativeNode].inputs.text = dynamicNegativePrompt;
        }

        // Seed & batch size
        if (config.seedNode && workflow[config.seedNode]?.inputs) {
          workflow[config.seedNode].inputs.seed = Math.floor(
            Math.random() * Number.MAX_SAFE_INTEGER
          );
        }
        if (type === "image" && config.batchNode && workflow[config.batchNode]?.inputs) {
          workflow[config.batchNode].inputs.batch_size = 1;
        }

        // Video-specific input
        if (type === "video" && config.imageInputNode && workflow[config.imageInputNode]?.inputs) {
          const filename = extractFilename(mainImage);
          workflow[config.imageInputNode].inputs.image = `${filename} [output]`;
        }

        // Call the utility function and get the output
        const foundImage = await sendWorkflowAndPoll(workflow, "http://localhost:3001");

        if (foundImage) {
          setMainImage((prev) => prev || foundImage);
          setVariations((prev) => [foundImage, ...prev]);
        } else {
          console.warn("⚠️ No image found after polling.");
        }
      }

    } catch (err) {
      console.error("❌ Error in handleGenerate:", err);
      alert(err.message || "Failed to generate media.");
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
          <label className="block mb-2 font-semibold text-white">Batch</label>
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
                      onClick={() => handleToggleTag(`${category}:${tag}`)}
                      className={`text-sm px-2 py-1 rounded ${
                        activeTags.has(`${category}:${tag}`)
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
                <span>Photographic</span>
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
            <div className="mt-6">   
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Small Breasts</span>
                <span>Huge Breasts</span>
              </div>           
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={breastSizeLevel}
                onChange={(e) => setBreastSizeLevel(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="mt-6">   
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Clothed</span>
                <span>Naked</span>
              </div>           
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={nudityLevel}
                onChange={(e) => setNudityLevel(Number(e.target.value))}
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
