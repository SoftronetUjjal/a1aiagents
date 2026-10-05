import sharp from 'sharp';
for (const [name, width] of [['hero-orbits',1536],['toronto-office',1920]]) {
 await sharp(`public/assets/${name}.png`).resize({width,withoutEnlargement:true}).webp({quality:88}).toFile(`public/assets/${name}.webp`);
 await sharp(`public/assets/${name}.png`).resize({width:800}).webp({quality:85}).toFile(`public/assets/${name}-mobile.webp`);
}
// Trim transparent whitespace for accurate logo sizing; preserve its native alpha.
await sharp('public/assets/a1-logo.png').trim().resize({width:1000}).webp({lossless:true}).toFile('public/assets/a1-logo.webp');
