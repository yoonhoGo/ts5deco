const { build } = require('esbuild');
const { resolve } = require('path');

const sharedConfig = {
  bundle: true,
  minify: true,
  sourcemap: true,
  platform: 'node',
  target: 'es2020',
  external: ['express'],
  treeShaking: true,
};

// Build main library - CommonJS
build({
  ...sharedConfig,
  entryPoints: [resolve(__dirname, 'src/index.ts')],
  format: 'cjs',
  outfile: resolve(__dirname, 'dist/index.js'),
}).catch(() => process.exit(1));

// Build main library - ESM
build({
  ...sharedConfig,
  entryPoints: [resolve(__dirname, 'src/index.ts')],
  format: 'esm',
  outfile: resolve(__dirname, 'dist/index.mjs'),
}).catch(() => process.exit(1));

// Build CLI
build({
  ...sharedConfig,
  entryPoints: [resolve(__dirname, 'src/cli/index.ts')],
  format: 'cjs',
  outfile: resolve(__dirname, 'dist/cli/index.js'),
  external: ['express', 'commander'],
  banner: {
    js: '#!/usr/bin/env node',
  },
}).catch(() => process.exit(1));

// Build TypeScript declarations
require('child_process').exec('tsc --emitDeclarationOnly --declaration', (error, stdout, stderr) => {
  if (error) {
    console.error('TypeScript declaration build failed:', error);
    process.exit(1);
  }
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
});
