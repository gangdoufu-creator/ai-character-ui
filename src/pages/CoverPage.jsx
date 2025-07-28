import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import girlTypes from "../utils/girlTypes";
import { SlidersHorizontal, User } from "lucide-react";
import { useEffect, useRef } from "react";

export default function CoverPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("Beautiful Lady");
  const [showBatchPanel, setShowBatchPanel] = useState(false);
  const [batchCount, setBatchCount] = useState(1);
  const [loading, setLoading] = useState(false);

const handleGetLucky = () => {
  if (!prompt.trim()) return;
  setLoading(true);
  const randomGirl = girlTypes[Math.floor(Math.random() * girlTypes.length)];
  navigate("/main", {
    state: { ...randomGirl, prompt, batchCount }
  });
};


  const settingsRef = useRef();
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

  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col">
      {/* Header */}
      <div className="w-full bg-gray-800 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-6 relative">
        {/* Left - Logo */}
        <h1
          onClick={() => navigate("/")}
          className="text-4xl font-bold text-white cursor-pointer "
        >
          Kissme.ai
        </h1>

        {/* Middle - Prompt and Button */}
        <div className="flex flex-1 mx-6 items-center gap-4">
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
              className={`px-6 py-[11px] text-sm font-semibold text-white rounded ${loading ? "bg-gray-600 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
            >
              {loading ? "Generating..." : "Get Lucky"}
            </button>

        </div>

        {/* Right - Settings + Account */}
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
          ref={settingsRef}
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

      {/* Grid of Girls */}
      <div className="flex-1 p-10">
        <h2 className="text-4xl font-bold text-center mb-10">Choose Your Dream Girl</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 place-items-center">
          {girlTypes.map((girl, index) => (
            <div
              key={index}
              onClick={() => navigate("/main", { state: girl })}
              className="cursor-pointer bg-gray-800 hover:bg-gray-700 hover:scale-105 transition rounded-xl overflow-hidden shadow-lg w-[280px]"
            >
              {girl.video ? (
                <video
                  src={girl.video}
                  muted
                  loop
                  preload="metadata"
                  className="w-[256px] h-[384px] object-cover mx-auto mt-4 rounded-md"
                  onMouseEnter={(e) => e.target.play()}
                  onMouseLeave={(e) => {
                    e.target.pause();
                    e.target.currentTime = 0;
                  }}
                />
              ) : (
                <img
                  src={girl.image}
                  alt={girl.name}
                  className="w-[256px] h-[384px] object-cover mx-auto mt-4 rounded-md"
                />
              )}
              <div className="p-4 text-center">
                <h3 className="text-xl font-bold mb-1">{girl.name}</h3>
                <p className="text-sm text-gray-300">{girl.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

