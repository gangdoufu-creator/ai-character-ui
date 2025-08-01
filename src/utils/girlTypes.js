// src/utils/girlTypes.js

import MixedImg from "../assets/girl-types/Mixed.png";
import TwoImg from "../assets/girl-types/TwoD.png";
import realistic from "../assets/girl-types/realistic.png";
import PhotographicVideo from "../assets/girl-types/Photographic.mp4";
import PixarImg from "../assets/girl-types/Pixar.png";

export const girlTypes = [
  {
    name: "KemiD",
    description: "Playful and competitive",
    image: TwoImg,
    prompt: ""
  },
  {
    name: "Stacey",
    description: "Spicy and fun",
    image: PixarImg,
    prompt: ""
  },
  {
    name: "Mahiko",
    description: "Shy, sweet, soft-spoken",
    image: MixedImg,
    prompt: ""
  },
  
  {
    name: "Jessica",
    description: "Powerful, assertive, seductive",
    image: realistic,
    prompt: ""
  },
  {
    name: "Suzi",
    description: "Elegant and elusive",
    video: PhotographicVideo,
    prompt: ""
  }

];
export default girlTypes; // ✅ this fixes the error