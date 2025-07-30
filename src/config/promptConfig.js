export const tagCategories = {
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
  1: { 
    label: "Clothed", 
    pos: ["sexy clothes", "teasing outfit", "covered cleavage"], 
    neg: ["excessive cleavage", "nudity", "explicit poses"] 
  },
  2: { 
    label: "Suggestive", 
    pos: ["suggestive", "flirty look", "revealing outfits"], 
    neg: ["full nudity", "explicit content"] 
  },
  3: { 
    label: "Bikini", 
    pos: ["bikini", "beach outfit", "revealing but tasteful"], 
    neg: ["full nudity", "explicit content"] 
  },
  4: { 
    label: "Underwear", 
    pos: ["underwear", "lingerie"], 
    neg: ["explicit scenes", "hardcore poses"] 
  },
  5: { 
    label: "Nude", 
    pos: ["nude", "tasteful nudity", "natural lighting"], 
    neg: ["clothes", "covered", "censored", "overly erotic"] 
  }
};

export const bodyTypePrompts = {
  1: { 
    label: "Petite", 
    pos: ["little figure", "delicate build", "samll figure"], 
    neg: ["muscular", "very curvy"] },
  2: { 
    label: "Skinny", 
    pos: ["slim figure", "delicate build", "skinny"], 
    neg: ["muscular", "very curvy"] },
  3: { 
    label: "Athletic", 
    pos: ["fit body", "toned muscles"], 
    neg: ["overweight", "very thin"] },
  4: { 
    label: "Curvy", 
    pos: ["curvy shape", "soft figure"], 
    neg: ["flat", "skinny"] },
  5: { 
    label: "Voluptuous", 
    pos: ["fat body", "overweight", "chubby"], 
    neg: ["slim", "flat", "skinny"] }
};


export const breastSizePrompts = {
  1: { 
    label: "Small", 
    pos: ["small breasts", "petite figure", "natural proportions"], 
    neg: ["oversized breasts", "unnatural proportions"] 
  },
  2: { 
    label: "Medium", 
    pos: ["medium breasts", "balanced figure"], 
    neg: ["gigantic breasts", "unnatural proportions"] 
  },
  3: { 
    label: "Large", 
    pos: ["large breasts", "curvy figure"], 
    neg: ["very small breasts", "flat chest"] 
  },
  4: { 
    label: "Very Large", 
    pos: ["very large breasts", "voluptuous figure"], 
    neg: ["very small breasts"] 
  },
  5: { 
    label: "Huge", 
    pos: ["huge breasts", "busty"], 
    neg: ["flat chest", "unrealistic proportions"] 
  }
};

export const realismSettings = {
  1: { 
    label: "Hentai", 
    pos: ["anime style", "vivid colors", "high contrast"], 
    neg: ["realistic faces", "low detail"], 
    model: ["abyssorangemix3A0M3_aom3a1b.safetensors"], 
    cfg: 8.5, 
    steps: 28 
  },
  2: { 
    label: "Pixar", 
    pos: ["3D render style", "cartoony features", "bright lighting"], 
    neg: ["photo-realism", "gritty"], 
    model: ["realcartoon3d_v18.safetensors"], 
    cfg: 8, 
    steps: 32 
  },
  3: { 
    label: "Mixed", 
    pos: ["blend of anime and realism", "balanced lighting"], 
    neg: ["extreme photo-realism", "overly stylized"], 
    model: ["animesh_PrunedV22.safetensors"], 
    cfg: 8.5, 
    steps: 32 
  },
  4: { 
    label: "Realistic", 
    pos: ["sharp focus", "detailed textures", "cinematic lighting"], 
    neg: ["cartoon style", "overly saturated colors"], 
    model: ["hellorealistic_V11.safetensors"], 
    cfg: 9, 
    steps: 28 
  },
  5: { 
    label: "Photographic", 
    pos: ["photographic quality", "lifelike details", "perfect lighting"], 
    neg: ["cartoony features", "stylized look"], 
    model: ["japaneseStyleRealistic_v20.safetensors"], 
    cfg: 10, 
    steps: 28 
  }
};
