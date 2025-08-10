declare global {
	interface IHandleSelectChangeItem {
		label: string;
		value: string;
	}

	interface ToolResult {
		success: boolean;
		output: string;
		error?: string;
	}
	type ProgressStore = {
		progress: string;
		setProgress: (progress: string) => void;
		resetProgress: () => void;
	};
	type ContextStore = {
		context: string;
		setContext: (context: string) => void;
	};
	type PersonaStore = {
		persona: string;
		setPersona: (persona: string) => void;
	};
	interface IUsageMetadata {
		input_tokens: number;
		output_tokens: number;
		total_tokens: number;
	}
	type UsageMetaDataStore = {
		input_tokens: number;
		output_tokens: number;
		total_tokens: number;
		setUsageMetaData: (data: IUsageMetadata) => void;
	};
}
export {};
