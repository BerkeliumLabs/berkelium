import esbuild from 'esbuild';
import config from '../esbuild.config.js';

const ctx = await esbuild.context({
	...config,
	minify: false,
	sourcemap: true,
});

console.log('👀 Watching for changes...');
await ctx.watch();

// Optional: serve for development
// await ctx.serve({ servedir: 'dist' });
