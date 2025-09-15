import esbuild from 'esbuild';
import config from '../esbuild.config.js';
import dotenv from 'dotenv';
import {readFileSync} from 'fs';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load package.json to get version
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
const version = packageJson.version;

// Load .env.dev file
const envConfig = dotenv.parse(readFileSync('.env.dev'));

// Create define object for esbuild, including the package version
const define = {
	'process.env.npm_package_version': JSON.stringify(version)
};
for (const k in envConfig) {
	define[`process.env.${k}`] = JSON.stringify(envConfig[k]);
}

await esbuild.build({
	...config,
	define,
});
console.log('✅ Build completed!\n\n');
