import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, SlidersHorizontal } from "lucide-react";

export default function MainPage() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [defaultTags, setDefaultTags] = useState(() =>
    localStorage.getItem("defaultTags") ||
    "vibrant colours, dslr-level detail, realistic hair, photoreal skin pores, canon eos r5, soft background bokeh, nikon, f1.4, pretty, beautiful, detailed face, real face, stunning, pale skin, shaven, detailed skin"
  );

  useEffect(() => {
    if (selectedGirl?.image || selectedGirl?.video) {
      setMainImage(selectedGirl.image || selectedGirl.video);
    }
  }, [selectedGirl]);

  const realismToPrompt = (level) => {
    const map = {
      1: "cartoon, low detail",
      2: "stylized, soft lighting",
      3: "realistic, standard detail",
      4: "photorealistic, high detail",
      5: "hyper-realistic, ultra detail, ray tracing"
    };
    return map[level] || "";
  };

  const fullPrompt = `${prompt}, ${realismToPrompt(realism)}`;

  const handleGenerate = (type) => {
    console.log("Generating:", type);
  };

  const handleToggleTag = (tag) => {
    setActiveTags((prev) => {
      const updated = new Set(prev);
      updated.has(tag) ? updated.delete(tag) : updated.add(tag);
      return updated;
    });
  };

  const tagCategories = {
    Style: ["cinematic", "hdr", "bokeh", "sharp focus"],
    Mood: ["happy", "romantic", "mysterious"],
    Detail: ["freckles", "wet skin", "dim lighting"]
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col">
      {/* Header */}
      <div className="w-full bg-gray-800 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-6 relative">
        <h1
          onClick={() => navigate("/")}
          className="text-4xl font-bold text-white whitespace-nowrap cursor-pointer hover:text-pink-400"
        >
          Kissme.ai
        </h1>

        {/* Middle - Prompt and Button */}
        <div className="flex flex-1 mx-2 items-center gap-4">
          <textarea
            rows={1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt..."
            className="flex-1 p-2 bg-gray-700 text-white border border-gray-600 rounded resize-none"
          />
          <button
            onClick={() => handleGenerate("image")}
            disabled={loading}
              className={`px-6 py-[11px] text-sm font-semibold text-white rounded ${loading ? "bg-gray-600 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
            >
            {loading ? "Generating..." : "Get Lucky"}
          </button>

        </div>

        {/* Settings & User buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBatchPanel((prev) => !prev)}
            className="text-white hover:text-gray-300 p-2 rounded-full bg-gray-700 hover:bg-gray-600"
            title="Batch Settings"
          >
            <SlidersHorizontal className="w-6 h-6" />
          </button>

          <button
            onClick={() => navigate("/account")}
            className="text-white hover:text-gray-300 p-2 rounded-full bg-gray-700 hover:bg-gray-600"
            title="Your Account"
          >
            <User className="w-6 h-6" />
          </button>
        </div>
      </div>

      {showBatchPanel && (
        <div 
          ref={settingsref}
          className="absolute right-6 top-[90px] bg-gray-700 shadow-lg border border-gray-300 rounded p-3 z-50 text-sm w-48">
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

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="w-42 p-3 overflow-y-auto bg-grey-200">

          <div className="mt-6">
            <label htmlFor="realism-slider" className="block text-sm font-medium mb-0">
              Realism
            </label>
            <input
              id="realism-slider"
              type="range"
              min="1"
              max="5"
              step="1"
              value={realismLevel}
              onChange={(e) => setRealismLevel(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none bg-gray-300 accent-pink-500"
            />
          </div>

          <h2 className="text-xl font-bold my-4">Prompt Tags</h2>
          {Object.entries(tagCategories).map(([category, tags]) => (
            <div key={category} className="mb-4">
              <h3 className="text-md font-semibold mb-1">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className={`text-sm px-2 py-1 rounded ${activeTags.has(tag)
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

        {/* Center Panel */}
        <div className="flex-1 flex flex-col items-center justify-start p-4 relative bg-grey-200">

          <div className="w-[512px] h-[768px] flex items-center justify-center mt-4 rounded-b-none">
            {mainImage &&
              (mainImage.endsWith(".mp4") ? (
                <video
                  src={mainImage}
                  controls
                  autoPlay
                  loop
                  muted
                  className="max-h-full max-w-full object-contain rounded-lg rounded-b-none"
                />
              ) : (
                <img
                  src={mainImage}
                  alt="Selected"
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              ))}
          </div>

          <button
            onClick={() => handleGenerate("video")}
            disabled={loading}
            className={`mt-0 w-[512px] p-2 text-white rounded-t-none rounded text-sm font-semibold ${loading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-gray-600 hover:bg-gray-800"
              }`}
          >
            {loading ? "Generating Video..." : "Generate Video"}
          </button>
        </div>

        {/* Right Panel */}
        <div className="w-48 p-3 overflow-y-auto bg-gradient-to-b from-gray-900 to-black">

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

      {/* Dev Panel */}
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
