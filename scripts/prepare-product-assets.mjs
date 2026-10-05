/* Builds the product card images from their full-resolution sources.
 *
 * Each product renders at /assets/product-<name>.webp with a -mobile variant
 * behind a (max-width:700px) source, and the markup declares 1200x675, so the
 * sizes here are fixed rather than derived. Sources are 16:9 already; one that
 * is not gets letterboxed by fit:'contain' rather than silently cropped, which
 * is the failure worth seeing.
 *
 * Entries are [imageName, sourceFile]. imageName matches the optional `image`
 * key on the product in src/content.js, which falls back to the product id
 * when absent.
 *
 * Replacing artwork under an existing name does not reach anyone. Files in
 * public/ keep their filename through the build, so the URL never changes and
 * a CDN — along with every browser that has already been to the site — goes
 * on serving the bytes it cached. New artwork needs a new name, here and in
 * content.js, so the URL changes with it.
 *
 * The sources carry an alpha channel they do not use, so it is flattened out:
 * the card sits on the page background, and a stray alpha channel only costs
 * bytes.
 *
 * Run after adding or replacing a source: node scripts/prepare-product-assets.mjs
 */
import sharp from 'sharp';

const products = [
  ['kuberan-ai', 'kuberan_ai.png']
];

for (const [name, source] of products) {
  const base = sharp(`public/assets/${source}`).flatten({background: '#0d0c0b'});

  await base.clone()
    .resize({width: 1200, height: 675, fit: 'contain', background: '#0d0c0b'})
    .webp({quality: 88})
    .toFile(`public/assets/product-${name}.webp`);

  await base.clone()
    .resize({width: 700, height: 394, fit: 'contain', background: '#0d0c0b'})
    .webp({quality: 85})
    .toFile(`public/assets/product-${name}-mobile.webp`);

  console.log(`product-${name}.webp and -mobile rebuilt from ${source}`);
}
