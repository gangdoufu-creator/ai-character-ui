import { realismPrompts, nudityPrompts, breastSizePrompts } from "../config/promptConfig";

export function buildFullPrompt({
  defaultTags,
  prompt,
  realismLevel,
  nudityLevel,
  breastSizeLevel,
  activeTags
}) {
  const realism = realismPrompts[realismLevel];
  const nudity = nudityPrompts[nudityLevel];
  const breastSize = breastSizePrompts[breastSizeLevel];

  // Map active tags into readable text
  const activeTagsText = [...activeTags]
    .map((tag) => {
      const [category, value] = tag.split(":");
      if (category === "Hair Color") return `${value} Hair`;
      if (category === "Eye Color") return `${value} Eyes`;
      return value;
    })
    .join(", ");

  // If user entered text, use it; otherwise build purely from sliders/tags
  const usePrompt = prompt?.trim().length > 0 ? prompt.trim() : "";

  // Build the final prompt
  let finalPrompt = [
    defaultTags,                // always include default tags if set
    usePrompt,                  // user prompt text if any
    ...realism.pos,              // realism slider
    ...nudity.pos,               // nudity slider
    ...breastSize.pos,           // breast size slider
    activeTagsText               // active tags
  ]
    .filter(Boolean)              // remove empty strings
    .join(", ");

  // If it's still empty (unlikely), at least include slider defaults
  if (!finalPrompt.trim()) {
    finalPrompt = [
      ...realism.pos,
      ...nudity.pos,
      ...breastSize.pos
    ].join(", ");
  }

  return finalPrompt;
}


/**
 * Build the negative prompt string
 */
export function buildNegativePrompt({ realismLevel, nudityLevel, breastSizeLevel }) {
  const realism = realismPrompts[realismLevel];
  const nudity = nudityPrompts[nudityLevel];
  const breastSize = breastSizePrompts[breastSizeLevel];

  return [
    "(worst quality:2)",
    "(low quality:2)",
    "bad anatomy",
    "watermark",
    "extra arms",
    ...realism.neg,
    ...nudity.neg,
    ...breastSize.neg
  ].join(", ");
}
