// src/utils/girlTypes.js

import YumiImg from "../assets/girl-types/Yumi.png";
import SukiImg from "../assets/girl-types/Suki.png";
import MakiImg from "../assets/girl-types/Maki.png";
import KarikoVideo from "../assets/girl-types/Kariko.mp4";

export const girlTypes = [
  {
    name: "Asian",
    description: "Shy, sweet, soft-spoken",
    image: YumiImg,
    prompt: "cute shy girl, pale skin, gentle eyes, soft lighting"
  },
  {
    name: "Hentai",
    description: "Playful and competitive",
    image: SukiImg,
    prompt: "cool gamer girl, headset, confident, cyberpunk room"
  },
  {
    name: "The Dominant",
    description: "Powerful, assertive, seductive",
    image: MakiImg,
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