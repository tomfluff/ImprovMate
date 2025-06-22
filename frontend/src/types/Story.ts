import { TEntity } from "./Entity";

export type TAnalytics = {
  entities: TEntity[];
  intensity: string;
  emotion: string;
  positioning: string;
  complexity: string;
};

export type TAction = {
  id: string;
  title: string;
  desc: string;
  active: boolean;
  used: boolean;
  isImprov: boolean;
};

export type TStoryImage = {
  promt: string;
  url: string;
};

export type TStoryPart = {
  id: string;
  text: string;
  sentiment?: "happy" | "sad" | "neutral" | "shocking";
  keymoment?: string;
  actions?: TAction[];
  image?: string;
  analytics?: TAnalytics;
  who?: string[];
  where?: string;
  objects?: string[];
  improv?: boolean;
};

export type TStory = {
  id: string;
  start: number;
  parts: TStoryPart[];
};
