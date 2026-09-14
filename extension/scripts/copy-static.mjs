import { cp, copyFile, mkdir } from 'node:fs/promises';
import { URL } from 'node:url';

const extensionRoot = new URL('../', import.meta.url);
const outputRoot = new URL('dist/', extensionRoot);

await mkdir(outputRoot, { recursive: true });

// TypeScript ne copie que le JavaScript compile. Le manifeste, le HTML et le CSS
// sont recopies separement pour produire un dossier chargeable par le navigateur.
await copyFile(new URL('manifest.json', extensionRoot), new URL('manifest.json', outputRoot));
await cp(new URL('public/', extensionRoot), outputRoot, { recursive: true });
