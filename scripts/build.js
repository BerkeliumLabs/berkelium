import esbuild from 'esbuild';
import config from '../esbuild.config.js';

await esbuild.build(config);
console.log('✅ Build completed!\n\n');
