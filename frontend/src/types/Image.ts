import { TEntity } from "./Entity";

export type TColorUsage = {
  color: string;
  usage: number;
};

export type TImage = {
  src: string;
  content?: string;
  style?: string;
  items?: TEntity[];
  colors?: TColorUsage[];
};
