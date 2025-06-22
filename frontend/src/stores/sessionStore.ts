import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { createSelectors } from "../utils/createSelectors";

export type TLogElement = {
  time: number;
  type: string;
  data: any;
};

const initialState = {
  id: null as string | null,
  start: Date.now(),
  update: Date.now(),
  avatar: "user1.png",
  log: [] as TLogElement[],
};

export type TSession = typeof initialState;

export const useSessionStore = createSelectors(
  create<TSession>()(
    devtools(
      persist(() => initialState, {
        name: "session",
        storage: createJSONStorage(() => sessionStorage),
      }),
      {
        name: "Session",
      }
    )
  )
);

export const initSession = (id: string) => {
  useSessionStore.setState(() => {
    return {
      id,
      start: Date.now(),
      update: Date.now(),
      avatar: `user${Math.floor(Math.random() * 6) + 1}.png`,
    };
  });
};

export const resetSession = () => {
  useSessionStore.setState(initialState);
};

export const addLogging = (type: string, data: any) => {
  useSessionStore.setState((state) => {
    return {
      update: Date.now(),
      log: [
        ...state.log,
        {
          time: Date.now(),
          type,
          data,
        },
      ],
    };
  });
};

type InstructionsLang = {
  [key: string]: string[];
};

export const instructionsLang: InstructionsLang = {
  "en": [
    "Your Adventure Awaits",
    "1. Start a",
    "New Session",
    "to set up the system, and feel free to change the settings.",
    "2. Choose a game mode:",
    "Draw!",
    "3. Upload and",
    "Capture your Drawing",
    "to define the context of your story.",
    "4. Select a",
    "Premise",
    "to set the stage for your story.",
    "Improvise!",
    "3. Voice and movements can be used to describe the context.",
    "4. Test your skills and ",
    "Improvise",
    "to start the story!",
    "Three Things!",
    "1. Train your reactivity!",
    "2. You must always have a ready answer!",
    "Start!",
    "Ending!",
    "1. Try to conclude absurd stories!",
    "2. Be creative!",
    "Start!"],

  "it": [
    "La tua avventura ti aspetta",
    "1. Inizia una",
    "Nuova Sessione",
    "per configurare il sistema, e sentiti libero di modificare le impostazioni.",
    "2. Scegli una modalità di gioco:",
    "Disegna!",
    "3. Carica e",
    "Cattura il tuo disegno",
    "per definire il contesto della tua storia.",
    "4. Seleziona una",
    "Premessa",
    "per preparare il terreno alla tua storia.",
    "Improvvisa!",
    "3. Dialoghi e movimenti possono essere usati per descrivere il contesto.",
    "4. Testa le tue abilità e ",
    "Improvvisa",
    "per iniziare la storia!",
    "Tre cose che...!",
    "1. Allena la tua reattività!",
    "2. Devi sempre avere una risposta pronta!",
    "Inizia!",
    "Conclusioni!",
    "1. Prova a concludere storie assurde!",
    "2. Sii creativo!",
    "Inizia!",
  ]
}