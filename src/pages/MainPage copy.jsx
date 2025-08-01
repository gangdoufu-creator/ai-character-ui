import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, SlidersHorizontal } from "lucide-react";
import { workflowConfigs } from "../config/workflowConfig";
import {
  tagCategories,
  nudityPrompts,
  breastSizePrompts,
  realismSettings,
  bodyTypePrompts,
} from "../config/promptConfig";
import {
  buildFullPrompt,
  buildNegativePrompt,
} from "../utils/promptUtils";
import {
  sendWorkflowAndPoll,
  extractFilename,
} from "../utils/workflowUtils";

export default function MainPage() {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const settingsref = useRef();
  const selectedGirl = location.state;

  const [mainImage, setMainImage] = useState(null);
  const [prompt, setPrompt] = useState(
    selectedGirl?.prompt ||
      localStorage.getItem("initialPrompt") ||
      "Beautiful Lady"
  );
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTags, setActiveTags] = useState(new Set());
  const [batchCount, setBatchCount] = useState(1);

  const [realismLevel, setRealismLevel] = useState(1);
  const [bodyTypeLevel, setBodyTypeLevel] = useState(3);
  const [breastSizeLevel, setBreastSizeLevel] = useState(2);
  const [nudityLevel, setNudityLevel] = useState(3);

  const [showBatchPanel, setShowBatchPanel] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  const [defaultTags, setDefaultTags] = useState(() =>
    localStorage.getItem("defaultTags") || ""
  );

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
    console.log("🔹 Get Lucky button clicked. Current prompt:", prompt);

    // Only block if trying to make a video with no base image
    if (type === "video" && !mainImage) {
      alert("Please generate or select an image first.");
      return;
    }

    const fullPrompt = buildFullPrompt({
      defaultTags,
      prompt,
      realismLevel,
      bodyTypeLevel,
      nudityLevel,
      breastSizeLevel,
      activeTags,
    });
    
    const dynamicNegativePrompt = buildNegativePrompt({
      realismLevel,
      nudityLevel,
      breastSizeLevel,
    });


    // 🖨️ Log to Console
    console.log("➡️ Full Prompt (Positive):", fullPrompt);
    console.log("⬅️ Negative Prompt:", dynamicNegativePrompt);


    setLoading(true);

    try {
      const config = workflowConfigs[type];
      if (!config) throw new Error(`❌ Invalid type: ${type}`);

      const response = await fetch(config.file);
      if (!response.ok) throw new Error("❌ Failed to load workflow file");
      const baseWorkflow = await response.json();

      const selectedRealism = realismSettings[realismLevel];
      const randomModel =
        selectedRealism.model[
          Math.floor(Math.random() * selectedRealism.model.length)
        ];

      for (let i = 0; i < batchCount; i++) {
        const workflow = JSON.parse(JSON.stringify(baseWorkflow));

        for (const node of Object.values(workflow)) {
          if (node.class_type === "CheckpointLoaderSimple") {
            node.inputs.ckpt_name = randomModel;
          }
          if (node.class_type === "KSampler") {
            node.inputs.cfg = selectedRealism.cfg;
            node.inputs.steps = selectedRealism.steps;
          }
        }
        console.log(`🟢 Injected Checkpoint Model: ${randomModel}`);

        if (config.promptNode && workflow[config.promptNode]?.inputs) {
          workflow[config.promptNode].inputs.text = fullPrompt;
        }
        if (config.negativeNode && workflow[config.negativeNode]?.inputs) {
          workflow[config.negativeNode].inputs.text = dynamicNegativePrompt;
        }

        if (config.seedNode && workflow[config.seedNode]?.inputs) {
          workflow[config.seedNode].inputs.seed = Math.floor(
            Math.random() * Number.MAX_SAFE_INTEGER
          );
        }

        if (type === "video" && config.imageInputNode) {
          const filename = extractFilename(mainImage);
          workflow[config.imageInputNode].inputs.image = `${filename} [output]`;
        }
        console.log("🚀 Final Workflow JSON Sent to ComfyUI:", JSON.stringify(workflow, null, 2));
        const foundImage = await sendWorkflowAndPoll(
          workflow,
          "http://localhost:3001"
        );

        if (foundImage) {
          setMainImage((prev) => prev || foundImage);
          setVariations((prev) => [foundImage, ...prev]);
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
      {/* Header */}
      <div className="w-full bg-black px-4 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-6 relative">
        <h1
          onClick={() => navigate("/")}
          className="relative left-[4px] text-3xl font-bold text-white cursor-pointer"
        >
          Kissme.ai
        </h1>
        <div className="flex flex-1 mx-2 items-center gap-4 pr-0 ml-[18px]">
          <textarea
            rows={isExpanded ? 3 : 1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onBlur={() => setIsExpanded(false)}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={(e) => {
              if (!e.currentTarget.matches(':focus')) {
                setIsExpanded(false);
              }
            }}
            placeholder="Enter your dream prompt..."
            className="flex-1 p-2 bg-gray-700 text-white border border-gray-600 overflow-hidden rounded "
          />
          <button
            onClick={() => handleGenerate("image")}
            disabled={loading}
            className={`px-4 py-[8px] text-sm font-semibold text-white rounded ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
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

      {/* Batch Panel */}
      {showBatchPanel && (
        <div
          ref={settingsref}
          className="absolute right-6 top-[90px] bg-gray-700 shadow-lg border border-gray-300 rounded p-3 z-50 text-sm w-64 max-h-[80vh] overflow-y-auto"
        >
          {/* Batch Settings */}
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

          {/* Divider */}
          <div className="border-t border-gray-500 my-3"></div>

          {/* Sliders (same as left panel) */}
          <div className="bg-gray-800 rounded-lg px-3 py-3 shadow-md mb-4">
            {/* Realism */}
            <div className="mt-1">
              <div className="flex justify-between items-center mb-0.5">
                <h3 className="text-xs font-semibold text-white">Realism</h3>
                <div className="text-gray-300 text-xs">
                  {realismSettings[realismLevel]?.label || ""}
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={realismLevel}
                onChange={(e) => setRealismLevel(Number(e.target.value))}
                className="w-full h-1"
              />
            </div>

            {/* Body Type */}
            <div className="mt-1">
              <div className="flex justify-between items-center mb-0.5">
                <h3 className="text-xs font-semibold text-white">Body Type</h3>
                <div className="text-gray-300 text-xs">
                  {bodyTypePrompts[bodyTypeLevel]?.label || ""}
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={bodyTypeLevel}
                onChange={(e) => setBodyTypeLevel(Number(e.target.value))}
                className="w-full h-1"
              />
            </div>

            {/* Breast Size */}
            <div className="mt-1">
              <div className="flex justify-between items-center mb-0.5">
                <h3 className="text-xs font-semibold text-white">Breast Size</h3>
                <div className="text-gray-300 text-xs">
                  {breastSizePrompts[breastSizeLevel]?.label || ""}
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={breastSizeLevel}
                onChange={(e) => setBreastSizeLevel(Number(e.target.value))}
                className="w-full h-1"
              />
            </div>

            {/* Nudity */}
            <div className="mt-1">
              <div className="flex justify-between items-center mb-0.5">
                <h3 className="text-xs font-semibold text-white">Nudity</h3>
                <div className="text-gray-300 text-xs">
                  {nudityPrompts[nudityLevel]?.label || ""}
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={nudityLevel}
                onChange={(e) => setNudityLevel(Number(e.target.value))}
                className="w-full h-1"
              />
            </div>
          </div>

          {/* Tags Panel */}
          <div className="bg-gray-800 rounded-lg px-3 py-3 shadow-md">
            {Object.entries(tagCategories).map(([category, tags]) => (
              <div key={category} className="mb-2">
                <h3 className="text-xs font-semibold text-white text-center mb-1 py-1">
                  {category}
                </h3>
                <div className="flex flex-wrap gap-1 justify-center">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleToggleTag(`${category}:${tag}`)}
                      className={`text-xs px-2 py-0.5 rounded ${
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
          </div>
        </div>
      )}


      {/* Main flex container */}
      <div className="flex flex-1 overflow-hidden relative px-1 py-2">        
        {/* LEFT PANEL */}
        {showLeftPanel && (
          <div className="w-48 p-2 mr-1 overflow-y-auto bg-gradient-to-b from-gray-900 to-black hidden sm:flex flex-col justify-start rounded-lg">
            {/* Sliders */}
            <div className="bg-gray-800 rounded-lg px-3 py-3 shadow-md mb-4">
              {/* Realism */}
              <div className="mt-1">
                <div className="flex justify-between items-center mb-0.5">
                  <h3 className="text-xs font-semibold text-white">Realism</h3>
                  <div className="text-gray-300 text-xs">
                    {realismSettings[realismLevel]?.label || ""}
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={realismLevel}
                  onChange={(e) => setRealismLevel(Number(e.target.value))}
                  className="w-full h-1"
                />
              </div>
              {/* Body Type */}
              <div className="mt-1">
                <div className="flex justify-between items-center mb-0.5">
                  <h3 className="text-xs font-semibold text-white">Body Type</h3>
                  <div className="text-gray-300 text-xs">
                    {bodyTypePrompts[bodyTypeLevel]?.label || ""}
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={bodyTypeLevel}
                  onChange={(e) => setBodyTypeLevel(Number(e.target.value))}
                  className="w-full h-1"
                />
              </div>
              {/* Breast Size */}
              <div className="mt-1">
                <div className="flex justify-between items-center mb-0.5">
                  <h3 className="text-xs font-semibold text-white">Breast Size</h3>
                  <div className="text-gray-300 text-xs">
                    {breastSizePrompts[breastSizeLevel]?.label || ""}
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={breastSizeLevel}
                  onChange={(e) => setBreastSizeLevel(Number(e.target.value))}
                  className="w-full h-1"
                />
              </div>
              {/* Nudity */}
              <div className="mt-1">
                <div className="flex justify-between items-center mb-0.5">
                  <h3 className="text-xs font-semibold text-white">Nudity</h3>
                  <div className="text-gray-300 text-xs">
                    {nudityPrompts[nudityLevel]?.label || ""}
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={nudityLevel}
                  onChange={(e) => setNudityLevel(Number(e.target.value))}
                  className="w-full h-1"
                />
              </div>
            </div>

            {/* Tags Panel */}
            <div className="bg-gray-800 rounded-lg px-3 py-3 shadow-md">
              {Object.entries(tagCategories).map(([category, tags]) => (
                <div key={category} className="mb-2">
                  <h3 className="text-xs font-semibold text-white text-center mb-1 py-1">{category}</h3>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleToggleTag(`${category}:${tag}`)}
                        className={`text-xs px-2 py-0.5 rounded ${
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
            </div>
          </div>
        )}
        

        {/* Main Image Viewer */}
        <div className="flex-1 flex flex-col items-center justify-start p-0 px-2 relative bg-gray-800 overflow-hidden max-h-screen">
          <div className="w-full max-w-[512px] aspect-[2/3] flex items-center justify-center mt-2">
            {mainImage &&
              (mainImage.endsWith(".mp4") ? (
                <video
                  src={mainImage}
                  controls
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <img
                  src={mainImage}
                  alt="Selected"
                  className="w-full h-full object-contain rounded-lg"
                />
              ))}
          </div>
          <button
            onClick={() => handleGenerate("video")}
            disabled={loading}
            className={`mt-0 w-full max-w-[512px] p-2 text-white rounded-t-none rounded-b-lg text-sm font-semibold ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gray-600 hover:bg-gray-800"
            }`}
          >
            {loading ? "Generating Video..." : "Generate Video"}
          </button>
        </div>

        {/* Right Panel */}
        {showRightPanel && (
          <div className="right-panel overflow-y-auto bg-gradient-to-b from-gray-900 to-black relative flex-shrink-0 w-[15%] min-w-[40px] max-w-[200px] p-2 sm:p-3 h-[calc(100vh-80px)]">
            <div className="flex flex-col items-center space-y-2">
              {variations.length > 0 &&
                variations.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`variation-${idx}`}
                    className="rounded cursor-pointer w-16 sm:w-24 md:w-32 lg:w-40 transition-transform duration-200 hover:scale-105 hover:opacity-90"
                    onClick={() => setMainImage(img)}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
