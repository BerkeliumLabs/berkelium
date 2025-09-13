import {create} from 'zustand';
import {ToolCall} from '@langchain/core/messages/tool';

export type PermissionStatus = 'idle' | 'awaiting_permission' | 'executing';

export type PermissionChoice = 'allow_once' | 'allow_session' | 'deny';

export interface PermissionPromise {
	resolve: (choice: PermissionChoice) => void;
	reject: (error: Error) => void;
}

export interface PermissionStore {
	toolCallInProgress: ToolCall | null;
	status: PermissionStatus;
	permissionPromise: PermissionPromise | null;
	sessionPermissions: Record<string, boolean>;
	setToolCall: (toolCall: ToolCall) => void;
	setStatus: (status: PermissionStatus) => void;
	setPermissionPromise: (promise: PermissionPromise | null) => void;
	addSessionPermission: (toolName: string) => void;
	hasSessionPermission: (toolName: string) => boolean;
	resetPermissionState: () => void;
}

const usePermissionStore = create<PermissionStore>((set, get) => ({
	toolCallInProgress: null,
	status: 'idle',
	permissionPromise: null,
	sessionPermissions: {},

	setToolCall: (toolCall: ToolCall) => set({toolCallInProgress: toolCall}),

	setStatus: (status: PermissionStatus) => set({status}),

	setPermissionPromise: (promise: PermissionPromise | null) =>
		set({permissionPromise: promise}),

	addSessionPermission: (toolName: string) =>
		set(state => ({
			sessionPermissions: {...state.sessionPermissions, [toolName]: true},
		})),

	hasSessionPermission: (toolName: string) => {
		const state = get();
		return state.sessionPermissions[toolName] === true;
	},

	resetPermissionState: () =>
		set({
			toolCallInProgress: null,
			status: 'idle',
			permissionPromise: null,
		}),
}));

export default usePermissionStore;
