import esbuild from 'esbuild';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

esbuild.build({
  entryPoints: ['src/berkelium.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/berkelium.js',
  format: 'esm',
  external: Object.keys(packageJson.dependencies),
}).catch(() => process.exit(1));
