export const tagCategories = {
  "Body Type": ["Slim", "Athletic", "Curvy", "Voluptuous"],
  "Hair Color": ["Blonde", "Brunette", "Pink", "Blue", "Black"],
  "Eye Color": ["Blue", "Green", "Hazel", "Pink"]
};

export const realismPrompts = {
  1: { pos: ["2D", "cartoon style", "bright flat colors"], neg: ["blurry", "flat", "low detail", "muddy colors"] },
  2: { pos: ["2.5D", "stylized 3D look", "clean lineart"], neg: ["blurry details", "off proportions", "low poly look"] },
  3: { pos: ["3D", "cinematic render", "realistic lighting"], neg: ["over-smoothed textures", "fake depth", "plastic look"] },
  4: { pos: ["3.5D", "semi-realistic", "detailed skin textures"], neg: ["plastic skin", "uncanny valley"] },
  5: { pos: ["Photographic", "hyper-realistic details", "high-res"], neg: ["cartoonish features", "fake photographic artifacts"] }
};

export const nudityPrompts = {
  1: { pos: ["sexy clothes", "teasing outfit", "covered cleavage"], neg: ["excessive cleavage", "nudity", "explicit poses"] },
  2: { pos: ["suggestive", "flirty look", "revealing outfits"], neg: ["full nudity", "explicit content"] },
  3: { pos: ["bikini", "beach outfit", "revealing but tasteful"], neg: ["full nudity", "explicit content"] },
  4: { pos: ["underwear", "lingerie"], neg: ["explicit scenes", "hardcore poses"] },
  5: { pos: ["nude", "tasteful nudity", "natural lighting"], neg: ["clothes", "covered", "censored", "overly erotic"] }
};

export const breastSizePrompts = {
  1: { pos: ["small breasts", "petite figure", "natural proportions"], neg: ["oversized breasts", "unnatural proportions"] },
  2: { pos: ["medium breasts", "balanced figure"], neg: ["gigantic breasts", "unnatural proportions"] },
  3: { pos: ["large breasts", "curvy figure"], neg: ["very small breasts", "flat chest"] },
  4: { pos: ["very large breasts", "voluptuous figure"], neg: ["very small breasts"] },
  5: { pos: ["huge breasts", "busty"], neg: ["flat chest", "unrealistic proportions"] }
};

export const realismSettings = {
  1: { label: "Cartoon", model: ["abyssorangemix3A0M3_aom3a1b.safetensors"], cfg: 8, steps: 50 },
  2: { label: "Stylized", model: ["realcartoon3d_v18.safetensors"], cfg: 8, steps: 50 },
  3: { label: "Balanced", model: ["mixtapeBlues_v20Swamp.safetensors"], cfg: 8, steps: 50 },
  4: { label: "Semi-Realistic", model: ["semiReal.safetensors"], cfg: 8, steps: 50 },
  5: { label: "Photographic", model: ["japaneseStyleRealistic_v20.safetensors"], cfg: 8, steps: 50 }
};
