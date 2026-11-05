#!/usr/bin/env node

// Post-build script: copies manifest.json and icons into dist-extension
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const distDir = path.join(rootDir, 'dist-extension');

fs.mkdirSync(distDir, { recursive: true });
fs.copyFileSync(path.join(rootDir, 'manifest.json'), path.join(distDir, 'manifest.json'));
fs.cpSync(path.join(rootDir, 'icons'), path.join(distDir, 'icons'), { recursive: true });

// eslint-disable-next-line no-console
console.log(`✓ Extension ready in ${distDir}`);
