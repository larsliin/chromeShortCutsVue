// Copies manifest.json and icons into dist-extension (runs after every Vite build)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const distDir = path.join(rootDir, 'dist-extension');

export default function prepareExtension() {
    fs.mkdirSync(distDir, { recursive: true });
    fs.copyFileSync(path.join(rootDir, 'manifest.json'), path.join(distDir, 'manifest.json'));
    fs.cpSync(path.join(rootDir, 'icons'), path.join(distDir, 'icons'), { recursive: true });
}
