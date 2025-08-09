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
}
export {};
