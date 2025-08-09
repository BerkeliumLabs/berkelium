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
}
export {};
