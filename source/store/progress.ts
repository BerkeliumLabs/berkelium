import {create} from 'zustand';

const useProgressStore = create<ProgressStore>(set => ({
	progress: 'Thinking...',
	setProgress: (progress: string) => set({progress}),
	resetProgress: () => set({progress: 'Thinking...'}),
}));

export default useProgressStore;
