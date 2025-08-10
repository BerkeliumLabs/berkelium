import esbuild from 'esbuild';
import config from '../esbuild.config.js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load .env.prod file
const envConfig = dotenv.parse(readFileSync('.env.prod'));

// Create define object for esbuild
const define = {};
for (const k in envConfig) {
  define[`process.env.${k}`] = JSON.stringify(envConfig[k]);
}


await esbuild.build({
	...config,
	define,
	minify: true,
	sourcemap: false,
	metafile: false,
});

console.log('🚀 Production build completed!');
