import {create} from 'zustand';

export const useContextStore = create<ContextStore>(set => ({
	context: '',
	setContext: (context: string) => set({context}),
}));
