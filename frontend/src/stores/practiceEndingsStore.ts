import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { createSelectors } from "../utils/createSelectors";
import { TAction, TStory, TStoryPart } from "../types/Story";
import { randomId } from "@mantine/hooks";

const initialState = {
  id: null as string | null,
  story: null as TStory | null,
  finished: false,
};

export const usePracticeEndingsStore = createSelectors(
  create<typeof initialState>()(
    devtools(
      persist(() => initialState, {
        name: "endings",
        storage: createJSONStorage(() => sessionStorage),
      }),
      {
        name: "Endings",
      }
    )
  )
);

export const clearEndStore = () => {
  usePracticeEndingsStore.setState(initialState);
  usePracticeEndingsStore.setState(() => {
    return { id: randomId() };
  });
};

export const startStory = (story: TStory) => {
  usePracticeEndingsStore.setState(() => {
    console.log("PracticeEndingsStore -> startStory - story:", story);
    if (story.parts && story.parts[0]) {
      if (!story.parts[0].actions) {
        story.parts[0].actions = [];
      }
      story.parts[0].actions[0] = {
        id: "0",
        title: "Improvise",
        desc: "Use your improvisation to progress the story!",
        active: true,
        used: false,
        isImprov: true,
      };
    }
    console.log("PracticeEndingsStore -> startStory - story:", story);
    return {
      story,
    };
  });
};

export const appendStory = (part: TStoryPart, start: boolean) => {
  usePracticeEndingsStore.setState((state) => {
    if (!state.story) return state;
    if (!part.actions) {
      part.actions = [];
    }
    if (start) {
      part.actions[0] = {
        id: "",
        title: "Improvise",
        desc: "Use your improvisation to progress the story!",
        active: true,
        used: false,
        isImprov: true,
      };
    } else {
      part.actions[0] = {
        id: "",
        title: "Next",
        desc: "Generate a new story to conclude!",
        active: true,
        used: false,
        isImprov: false,
      };
      part.actions[1] = {
        id: "",
        title: "Try again",
        desc: "Try to finish the previous story again!",
        active: true,
        used: false,
        isImprov: false,
      };
      part.actions[2] = {
        id: "",
        title: "Finish",
        desc: "Finish the practice and return to the main screen!",
        active: true,
        used: false,
        isImprov: false,
      };
    }
    console.log("Story lenght in appendStory: ", state.story.parts.length);
    return {
      story: {
        ...state.story,
        parts: [...state.story.parts, part],
      },
    };
  });
};

export const tryAgain = () => {
  usePracticeEndingsStore.setState((state) => {
    if (!state.story) return state;
    const redopart = state.story.parts[state.story.parts.length - 2];
    return {
      story: {
        ...state.story,
        parts: [...state.story.parts, redopart],
      },
    };
  });
};

export const chooseAction = (action: TAction | null) => {
  if (action === null) {
    action = {
      id: "",
      title: "Improvise",
      desc: "",
      active: true,
      used: false,
      isImprov: true,
    };
    usePracticeEndingsStore.setState((state) => {
      if (!state.story) return state;
      const parts = state.story.parts;
      parts[parts.length - 2].actions = parts[parts.length - 2].actions?.map(
        (a) => {
          a.active = false;
          if (a.title === action?.title) {
            a.used = true;
          }
          return a;
        }
      );
      return {
        story: {
          ...state.story,
          parts,
        },
      };
    });
  }
  usePracticeEndingsStore.setState((state) => {
    if (!state.story) return state;
    const parts = state.story.parts;
    parts[parts.length - 1].actions = parts[parts.length - 1].actions?.map(
      (a) => {
        a.active = false;
        if (a.title === action.title) {
          a.used = true;
        }
        return a;
      }
    );
    return {
      story: {
        ...state.story,
        parts,
      },
    };
  });
};

export const printState = () => {
  console.log("Story state: ", usePracticeEndingsStore.getState());
};

export const getLastStoryText = () => {
  const parts = usePracticeEndingsStore.getState().story?.parts;
  return parts ? parts[parts.length - 1].text : null;
};

export const setFinished = (status: boolean | undefined) => {
  usePracticeEndingsStore.setState((state) => {
    return {
      ...state,
      finished: status,
    };
  });
};
