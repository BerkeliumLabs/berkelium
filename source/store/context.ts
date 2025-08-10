import { create } from "zustand";

export const usePersonaStore = create<PersonaStore>((set) => ({
    persona: "",
    setPersona: (persona: string) => set({ persona }),
}));

export const useContextStore = create<ContextStore>((set) => ({
    context: "",
    setContext: (context: string) => set({ context }),
}));
