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
  const [mainVideo, setMainVideo] = useState(null);
  const [prompt, setPrompt] = useState(
    selectedGirl?.prompt || localStorage.getItem("initialPrompt") || "Beautiful Lady"
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

  useEffect(() => {
    if ((selectedGirl?.image || selectedGirl?.video) && variations.length === 0) {
      const media = selectedGirl.image || selectedGirl.video;
      setVariations([{ url: media, type: media.endsWith(".mp4") ? "video" : "image" }]);
    }
  }, [selectedGirl, variations]);

  const addToGalleryIfUnique = (newItem) => {
    setVariations((prev) => {
      if (prev.find((item) => item.url === newItem.url)) {
        return prev; // Skip duplicates
      }
      return [newItem, ...prev];
    });
  };

  const handleGenerate = async (type = "image") => {
    console.log("🔹 Get Lucky button clicked. Current prompt:", prompt);

    const sourceMedia = mainImage || mainVideo;
    if (type === "video" && !sourceMedia) {
      alert("Please generate or select an image/video first.");
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

    setLoading(true);

    try {
      const config = workflowConfigs[type];
      if (!config) throw new Error(`❌ Invalid type: ${type}`);

      const response = await fetch(config.file);
      if (!response.ok) throw new Error("❌ Failed to load workflow file");
      const baseWorkflow = await response.json();

      const selectedRealism = realismSettings[realismLevel];
      const randomModel = selectedRealism.model[Math.floor(Math.random() * selectedRealism.model.length)];

      for (let i = 0; i < batchCount; i++) {
        const workflow = JSON.parse(JSON.stringify(baseWorkflow));

        for (const node of Object.values(workflow)) {
          if (node.class_type === "CheckpointLoaderSimple") node.inputs.ckpt_name = randomModel;
          if (node.class_type === "KSampler") {
            node.inputs.cfg = selectedRealism.cfg;
            node.inputs.steps = selectedRealism.steps;
          }
        }

        if (config.promptNode && workflow[config.promptNode]?.inputs) {
          workflow[config.promptNode].inputs.text = fullPrompt;
        }
        if (config.negativeNode && workflow[config.negativeNode]?.inputs) {
          workflow[config.negativeNode].inputs.text = dynamicNegativePrompt;
        }
        if (config.seedNode && workflow[config.seedNode]?.inputs) {
          workflow[config.seedNode].inputs.seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        }
        if (type === "video" && config.imageInputNode) {
          const filename = extractFilename(sourceMedia);
          workflow[config.imageInputNode].inputs.image = `${filename} [output]`;
          console.log(`✅ Patched node ${config.imageInputNode} with image: ${workflow[config.imageInputNode].inputs.image}`);
        } else{
          console.error(`❌ Image Input Node (${config.imageInputNode}) not found in workflow.`);
        }

        console.log("🚀 Sending Workflow to ComfyUI...");
        const foundImage = await sendWorkflowAndPoll(workflow, "https://f794m9d30tj252-3100.proxy.runpod.net");

        console.log("🎥 Generated Media URL:", foundImage);
        if (foundImage.endsWith(".mp4")) {
          const videoFilename = foundImage.split("filename=")[1];
          const publicUrl = `https://f794m9d30tj252-3100.proxy.runpod.net/public-output/${videoFilename}`;
          setMainVideo(publicUrl);
          addToGalleryIfUnique({ url: publicUrl, type: "video" });
        } else {
          setMainImage(foundImage);
          addToGalleryIfUnique({ url: foundImage, type: "image" });
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
        <h1 onClick={() => navigate("/")} className="text-3xl font-bold text-white cursor-pointer">Kissme.ai</h1>
        <div className="flex flex-1 mx-2 items-center gap-4">
          <textarea
            rows={isExpanded ? 3 : 1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onBlur={() => setIsExpanded(false)}
            placeholder="Enter your dream prompt..."
            className="flex-1 p-2 bg-gray-700 text-white border border-gray-600 rounded"
          />
          <button onClick={() => handleGenerate("image")} disabled={loading}
            className={`px-4 py-2 text-sm font-semibold rounded ${loading ? "bg-gray-600" : "bg-indigo-600 hover:bg-indigo-700"}`}>
            {loading ? "Generating..." : "Get Lucky"}
          </button>
          <button onClick={() => setShowBatchPanel((prev) => !prev)}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600" title="Batch Settings">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          <button onClick={() => navigate("/account")}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600" title="Your Account">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Batch Panel (existing code remains) */}
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

        <div className="flex-1 flex flex-col items-center justify-start px-2 bg-gray-800 overflow-hidden">
          <div className="w-full max-w-[512px] aspect-[2/3] flex items-center justify-center mt-2">
            {mainVideo ? (
              <video src={mainVideo} controls autoPlay loop muted className="w-full h-full object-contain rounded-lg" />
            ) : mainImage ? (
              <img src={mainImage} alt="Selected" className="w-full h-full object-contain rounded-lg" />
            ) : null}
          </div>
          <button onClick={() => handleGenerate("video")} disabled={loading}
            className={`mt-0 w-full max-w-[512px] p-2 text-white rounded-b-lg text-sm font-semibold ${loading ? "bg-gray-600" : "bg-gray-600 hover:bg-gray-800"}`}>
            {loading ? "Generating Video..." : "Generate Video"}
          </button>
        </div>

        {showRightPanel && (
          <div className="overflow-y-auto bg-gradient-to-b from-gray-900 to-black w-[15%] min-w-[40px] max-w-[200px] p-2 sm:p-3">
            <div className="flex flex-col items-center space-y-2">
              {variations.map((media, idx) => (
                media.type === "video" ? (
                  <div key={idx} className="relative cursor-pointer" 
                  onClick={() => { 
                    setMainVideo(media.url); 
                    setMainImage(null); 
                    }}>
                    <video src={media.url} muted loop className="rounded w-24 transition-transform duration-200 hover:scale-105 hover:opacity-90" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black bg-opacity-50 rounded-full p-1">▶️</div>
                    </div>
                  </div>
                ) : (
                  <img key={idx} src={media.url} alt={`variation-${idx}`} className="rounded cursor-pointer w-24 transition-transform duration-200 hover:scale-105 hover:opacity-90"
                    onClick={() => { 
                      setMainImage(media.url); 
                      setMainVideo(null); 
                    }} />
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
