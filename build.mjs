import { mkdirSync, copyFileSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
for (const file of ['index.html', 'index.css', 'app.js']) {
  copyFileSync(file, `dist/${file}`);
}
console.log('Build complete: dist/');
