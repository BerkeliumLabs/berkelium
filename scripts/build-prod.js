import esbuild from 'esbuild';
import config from '../esbuild.config.js';

await esbuild.build({
	...config,
	minify: true,
	sourcemap: false,
	metafile: false,
});

console.log('🚀 Production build completed!');
