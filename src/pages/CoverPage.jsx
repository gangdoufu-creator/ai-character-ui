import React from "react";
import YumiImg from "../assets/girl-types/Yumi.png";
import SukiImg from "../assets/girl-types/Suki.png";
import MakiImg from "../assets/girl-types/Maki.png";
import KarikoVideo from "../assets/girl-types/Kariko.mp4";

const girlTypes = [
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

export default function CoverPage({ onSelectGirl }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-10">
      <h1 className="text-5xl font-bold text-center mb-10">Choose Your Dream Girl</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 place-items-center">
        {girlTypes.map((girl, index) => (
          <div
            key={index}
            onClick={() => onSelectGirl(girl.prompt)}
            className="cursor-pointer bg-gray-800 hover:bg-gray-700 hover:scale-105 transition rounded-xl overflow-hidden shadow-lg w-[280px]"
          >
            {girl.video ? (
              <video
                src={girl.video}
                muted
                loop
                preload="metadata"
                className="w-[256px] h-[384px] object-cover mx-auto mt-4 rounded-md"
                onMouseEnter={e => e.target.play()}
                onMouseLeave={e => {
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
              <h2 className="text-xl font-bold mb-1">{girl.name}</h2>
              <p className="text-sm text-gray-300">{girl.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

