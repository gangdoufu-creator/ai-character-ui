import { useState, useEffect } from "react";

export default function MainPage() {
  const [prompt, setPrompt] = useState(() => localStorage.getItem("initialPrompt") || "Beautiful Lady");
  // All other state and logic as before...
  
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
            className="absolute right-5 top-[38px] transform -translate-y-1/2 text-white hover:text-gray-300 settings-icon"
            title="Batch Settings"
        >
            <SlidersHorizontal className="w-8 h-8" />
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
