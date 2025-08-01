// src/utils/girlTypes.js

import MixedImg from "../assets/girl-types/Mixed.png";
import SukiImg from "../assets/girl-types/Suki.png";
import LauraImg from "../assets/girl-types/Laura.png";
import KarikoVideo from "../assets/girl-types/Kariko.mp4";
import PixarImg from "../assets/girl-types/Pixar.png";

export const girlTypes = [
  {
    name: "2D",
    description: "Playful and competitive",
    image: SukiImg,
    prompt: "cool gamer girl, headset, confident, cyberpunk room"
  },
  {
    name: "3D",
    description: "Elegant and elusive",
    image: PixarImg,
    prompt: "mysterious beauty, gothic dress, dark background, silver eyes"
  },
  {
    name: "Mixed",
    description: "Shy, sweet, soft-spoken",
    image: MixedImg,
    prompt: "cute shy girl, pale skin, gentle eyes, soft lighting"
  },
  
  {
    name: "Realistic",
    description: "Powerful, assertive, seductive",
    image: LauraImg,
    prompt: "dominant woman, confident pose, tight leather, smoky eyes"
  },
  {
    name: "Photographic",
    description: "Elegant and elusive",
    video: KarikoVideo,
    prompt: "mysterious beauty, gothic dress, dark background, silver eyes"
  }

];
export default girlTypes; // ✅ this fixes the error