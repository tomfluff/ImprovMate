import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { createSelectors } from "../utils/createSelectors";
import { TStory, TStoryPart } from "../types/Story";

const initialState = {
  id: null as string | null,
  story: null as TStory | null,
  finished: false,
};

export const usePractice3ThingsStore = createSelectors(
  create<typeof initialState>()(
    devtools(
      persist(() => initialState, {
        name: "3things",
        storage: createJSONStorage(() => sessionStorage),
      }),
      {
        name: "3Things",
      }
    )
  )
);

export const clear3ThingsStore = () => {
  usePractice3ThingsStore.setState(initialState);
};

export const startStory = (story: TStory) => {
  usePractice3ThingsStore.setState(() => {
    console.log("Practice3ThingsStore -> startStory - story:", story);
    if (story.parts && story.parts[0]) {
      if (!story.parts[0].actions) {
        story.parts[0].actions = [];
      }
      story.parts[0].actions[0] = { id: "0", title: "Improvise", desc: "Use your improvisation to progress the story!", active: true, used: false, isImprov: true };
    }
    console.log("Practice3ThingsStore -> startStory - story:", story);
    return {
      story,
    };
  });
};

export const appendStory = (part: TStoryPart) => {
  usePractice3ThingsStore.setState((state) => {
    if (!state.story) return state;
    console.log("Story lenght in appendStory: ", state.story.parts.length);
    return {
      story: {
        ...state.story,
        parts: [...state.story.parts, part],
      },
    };
  });
};

export const printState = () => {
  console.log("Story state: ", usePractice3ThingsStore.getState());
}

export const getLastStoryText = () => {
  const parts = usePractice3ThingsStore.getState().story?.parts;
  return parts ? parts[parts.length - 1].text : null;
};

export const setFinished = (status: boolean | undefined) => {
  usePractice3ThingsStore.setState((state) => {
    return {
      ...state,
      finished: status,
    };
  });
};
