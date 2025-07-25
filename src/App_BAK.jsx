import { useState, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CoverPage from "./pages/CoverPage";
import asian_girl_001 from "./pages/asian_girl_001";


export default function App() {
  console.log("🟢 App.jsx is running latest version");
  
  const [showCover, setShowCover] = useState(true);
  const [prompt, setPrompt] = useState("Beautiful Lady");
  const [mainImage, setMainImage] = useState(null);
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTags, setActiveTags] = useState(new Set());
  const [batchCount, setBatchCount] = useState(1);
  const [showBatchPanel, setShowBatchPanel] = useState(false);
  const [progress, setProgress] = useState(0);
  const [defaultTags, setDefaultTags] = useState(() => {
    return localStorage.getItem("defaultTags") ||
      "vibrant colours, dslr-evel detail, realistic hair, photoreal skin pores, canon eos r5, soft background bokeh, nikon, f1.4, pretty, beautiful, detailed face, real face, stunning, pale skin, shaven, detailed skin";
  });
  const [negativePrompt, setNegativePrompt] = useState("(worst quality:2), (low quality:2), (normal quality:2), lowres, bad anatomy, watermark, extra arms, CGI, 3d, anime, cartoon, plastic skin, shiny skin, low quality, blurry, extra limbs, extra arms, bad anatomy, ugly, plastic breasts, wet, hairy, streaks, streaky");
  const [showDevPanel, setShowDevPanel] = useState(false);

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

function extractFilename(url) {
  const params = new URL(url).searchParams;
  return params.get("filename");
}



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
  console.log("🖼️ mainImage value:", mainImage);

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
      } else {
        throw new Error(`❌ Node ${config.promptNode} not found or missing inputs`);
      }

      if (config.negativeNode && workflow[config.negativeNode]?.inputs) {
        workflow[config.negativeNode].inputs.text = negativePrompt;
      }

      if (config.seedNode && workflow[config.seedNode]?.inputs) {
        const randomSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        workflow[config.seedNode].inputs.seed = randomSeed;
        console.log("🎲 Random seed set:", randomSeed);
      }
      
      if (type === "video" && config.imageInputNode && workflow[config.imageInputNode]?.inputs) {
        const imageFilename = extractFilename(mainImage);
        console.log("🖼️ TRIINH", config.imageInputNode, ":", imageFilename + " [output]");
        workflow[config.imageInputNode].inputs.image = imageFilename + " [output]";      
      }

      if (type === "image" && config.batchNode && workflow[config.batchNode]?.inputs) {
        workflow[config.batchNode].inputs.batch_size = batchCount;
        console.log("📦 Batch count set:", batchCount);
      }

      if (type === "video") {
        const filename = extractFilename(mainImage);
        console.log("📤 Sending move request for:", filename);
        await fetch("http://localhost:3001/move-to-input", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename }),
        });
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

  if (showCover) {
    return <CoverPage onSelectGirl={(presetPrompt) => {
      setPrompt(presetPrompt);
      setShowCover(false);
    }} />;
  }
