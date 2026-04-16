import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distPath = path.join(__dirname, '..', 'dist');
const manifestPath = path.join(distPath, 'manifest.json');

export default async function globalSetup() {
    const distExists = fs.existsSync(manifestPath);

    if (!distExists) {
        // eslint-disable-next-line no-console
        console.log('[E2E] dist/ not found — building extension…');
        execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
        // eslint-disable-next-line no-console
        console.log('[E2E] Build complete.');
    } else {
        // eslint-disable-next-line no-console
        console.log('[E2E] dist/ found, skipping build. Run "npm run build" manually if you changed source files.');
    }
}
