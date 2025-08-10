import { create } from "zustand";

export const useUsageMetaDataStore = create<UsageMetaDataStore>((set) => ({
	input_tokens: 0,
	output_tokens: 0,
	total_tokens: 0,
	setUsageMetaData: (data: IUsageMetadata) => set(() => ({ ...data }))
}));