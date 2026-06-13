// Сжимает все картинки в public/images/
// Запуск: npm run optimize-images

const sharp = require('../node_modules/sharp');
const fs = require('fs');
const path = require('path');

const DIRS = [
  { path: 'public/images/characters', maxWidth: 800  },
  { path: 'public/images/world',      maxWidth: 1200 },
];

async function compress(filePath, maxWidth) {
  const before = fs.statSync(filePath).size;
  const buf = fs.readFileSync(filePath);
  const meta = await sharp(buf).metadata();

  const compressed = await sharp(buf)
    .resize(Math.min(meta.width, maxWidth), null, { withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();

  fs.writeFileSync(filePath, compressed);

  const after = fs.statSync(filePath).size;
  const saved = Math.round((1 - after / before) * 100);
  const name = path.basename(filePath).padEnd(30);
  console.log(`  ${name} ${Math.round(before/1024)}KB → ${Math.round(after/1024)}KB  (−${saved}%)`);
}

(async () => {
  for (const dir of DIRS) {
    const full = path.join(process.cwd(), dir.path);
    if (!fs.existsSync(full)) continue;

    const files = fs.readdirSync(full).filter(f => /\.(webp|jpg|jpeg|png)$/i.test(f));
    if (files.length === 0) continue;

    console.log(`\n${dir.path}/`);
    for (const f of files) await compress(path.join(full, f), dir.maxWidth);
  }
  console.log('\nГотово.');
})();
