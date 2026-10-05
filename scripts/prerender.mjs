import {writeFile} from 'node:fs/promises';
import {renderPage} from '../src/render.js';
import {pages} from '../src/content.js';
for(const [page,{title,description}] of Object.entries(pages)){
const html=`<!doctype html>\n<html lang="en" id="top"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="${page==='index'?'#0d0c0b':'#f7f6f2'}"><title>${title}</title><meta name="description" content="${description}"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:type" content="website"><meta property="og:image" content="https://a1aiagents.com/assets/toronto-office.png"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/src/styles.css"></head><body>${renderPage(page)}<script type="module" src="/src/main.js"></script></body></html>`;
await writeFile(`${page}.html`,html);
}
