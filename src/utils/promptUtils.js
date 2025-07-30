import { realismPrompts, nudityPrompts, breastSizePrompts } from "../config/promptConfig";

/**
 * Build the full positive prompt string
 */
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

  // Map activeTags into model-friendly phrases
  const activeTagsText = [...activeTags]
    .map((tag) => {
      const [category, value] = tag.split(":");
      if (category === "Hair Color") return `${value} Hair`;
      if (category === "Eye Color") return `${value} Eyes`;
      return value;
    })
    .join(", ");

  return [
    defaultTags,
    prompt,
    ...realism.pos,
    ...nudity.pos,
    ...breastSize.pos,
    activeTagsText
  ]
    .filter(Boolean)
    .join(", ");
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
