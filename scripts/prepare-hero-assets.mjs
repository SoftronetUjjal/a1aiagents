import sharp from 'sharp';
for (const name of ['agents-network','applications-panels','transformation-path','products-platforms','industries-city','contact-conversation']) {
 await sharp(`public/assets/${name}.png`).resize({width:1536,withoutEnlargement:true}).webp({quality:88}).toFile(`public/assets/${name}.webp`);
 await sharp(`public/assets/${name}.png`).resize({width:800}).webp({quality:85}).toFile(`public/assets/${name}-mobile.webp`);
}
