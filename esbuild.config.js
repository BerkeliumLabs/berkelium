import esbuild from 'esbuild';

// Plugin to stub optional dependencies
const stubOptionalDependenciesPlugin = {
	name: 'stub-optional-dependencies',
	setup(build) {
		// Stub optional dependencies
		build.onResolve({ filter: /^(react-devtools-core|@babel\/code-frame|resolve\.exports)$/ }, (args) => {
			return {
				path: args.path,
				namespace: 'optional-dep-stub',
			};
		});
		
		build.onLoad({ filter: /.*/, namespace: 'optional-dep-stub' }, (args) => {
			return {
				contents: 'export default {}; export const __esModule = true;',
				loader: 'js',
			};
		});
	},
};

const config = {
	entryPoints: ['source/cli.tsx'],
	outdir: 'dist',
	bundle: true,
	platform: 'node',
	target: 'node16',
	format: 'esm',
	packages: 'external', // Keep all node_modules as external
	external: [
		// Node.js built-in modules
		'assert', 'buffer', 'child_process', 'crypto', 'events', 'fs', 'http', 'https', 
		'net', 'os', 'path', 'stream', 'url', 'util', 'zlib', 'process', 'tty',
	],
	plugins: [stubOptionalDependenciesPlugin],
	banner: {
		js: '#!/usr/bin/env node',
	},
	tsconfig: './tsconfig.json',
	minify: false,
	sourcemap: true,
	metafile: true,
};

export default config;
