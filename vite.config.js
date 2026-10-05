import {defineConfig} from 'vite';
import {resolve} from 'node:path';
import {pages} from './src/content.js';
import devContact from './scripts/dev-contact.mjs';
export default defineConfig({
 plugins:[devContact()],
 build:{rollupOptions:{input:Object.fromEntries(Object.keys(pages).map(p=>[p,resolve(import.meta.dirname,`${p}.html`)]))}}
});
