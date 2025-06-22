import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { createSelectors } from "../utils/createSelectors";

const initialState = {
  audioVolume: 1,
  audioSpeed: 1,
  language: "en", //TODO: Change to "it" if needed
  autoReadStorySections: false,
  includeStoryImages: true,
  storyComplexity: 3//TODO: max complexity
};

export type TPreferences = typeof initialState;

export const usePreferencesStore = createSelectors(
  create<TPreferences>()(
    devtools(
      persist(() => initialState, {
        name: "preferences",
        storage: createJSONStorage(() => sessionStorage),
      }),
      {
        name: "Preferences",
      }
    )
  )
);

export const resetPreferences = () => {
  usePreferencesStore.setState(initialState);
};

export const setPreferences = (preferences: any) => {
  usePreferencesStore.setState((state) => ({
    ...state,
    ...preferences,
  }));
};

export const setAudioVolume = (audioVolume: number) => {
  usePreferencesStore.setState((state) => ({
    ...state,
    audioVolume,
  }));
};

export const setAudioSpeed = (audioSpeed: number) => {
  usePreferencesStore.setState((state) => ({
    ...state,
    audioSpeed,
  }));
};
