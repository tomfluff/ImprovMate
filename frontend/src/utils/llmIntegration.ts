import { usePreferencesStore } from "../stores/preferencesStore";

type TComplexity = {
  value: number;
  label: string;
  prompt: string;
};

export const languageOptions = [
  { label: "English", value: "en" },
  { label: "Hebrew", value: "he" },
  { label: "Japanese", value: "ja" },
  { label: "Spanish", value: "es" },
  { label: "Italian", value: "it" },
];

export const complexityOptions: TComplexity[] = [
  {
    value: 0,
    label: "Easy",
    prompt:
      "Kindergarden to 2nd grade level of language and concepts. No complex words or ideas. Short sentences and paragraphs.",
  },
  {
    value: 1,
    label: "Medium",
    prompt:
      "3rd grade to 6th grade level of language and concepts. No complex words or ideas. Short sentences and paragraphs.",
  },
  {
    value: 2,
    label: "Hard",
    prompt:
      "7th grade to 12th grade level of language and concepts. Some complex words and ideas. Long sentences and paragraphs.",
  },
  {
    value: 3,
    label: "Expert",
    prompt:
      "Professional level of language and concepts. Many complex words and ideas. Long sentences and paragraphs.",
  },
];

export const getComplexityPrompt = (complexity: number) => {
  return complexityOptions.find((d) => d.value === complexity)?.prompt;
};

export const createCallContext = (data: any) => {
  console.log("Data in createCallContext: ", data);
  const complexity = usePreferencesStore.getState().storyComplexity;
  const complexityPrompt = getComplexityPrompt(complexity);
  return {
    complexity: complexityPrompt,
    context: data,
  };
};

export const createCallLanguage = (data: any) => {
  const language = usePreferencesStore.getState().language;
  console.log("Language in createCallLanguage: ", language);
  // console.log("Data in createCallLanguage: ", data);
  return { 
    audio: data,
    language: language,
  };
};