import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const idPath = path.join(__dirname, '../src/lib/i18n/messages/id.ts');
const enPath = path.join(__dirname, '../src/lib/i18n/messages/en.ts');

function parseTsDict(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => !line.trim().startsWith('import'));
  content = lines.join('\n')
    .replace(/export type[\s\S]*$/, '')
    .replace(/as const/g, '')
    .replace(/:\s*Messages/g, '')
    .replace(/:\s*string/g, '')
    .replace(/export const \w+(\s*:\s*\w+)?\s*=/, 'return');
  
  const fn = new Function(content);
  return fn();
}

try {
  const idMessages = parseTsDict(idPath);
  const enMessages = parseTsDict(enPath);

  function getKeys(obj, prefix = '') {
    let keys = [];
    for (const k in obj) {
      const p = prefix ? prefix + '.' + k : k;
      if (typeof obj[k] === 'object' && obj[k] !== null) {
        keys = keys.concat(getKeys(obj[k], p));
      } else {
        keys.push(p);
      }
    }
    return keys;
  }

  const idKeys = getKeys(idMessages);
  const enKeys = getKeys(enMessages);

  const idSet = new Set(idKeys);
  const enSet = new Set(enKeys);

  const missingInEn = idKeys.filter(k => !enSet.has(k));
  const missingInId = enKeys.filter(k => !idSet.has(k));

  console.log('ID Keys Total:', idKeys.length);
  console.log('EN Keys Total:', enKeys.length);
  console.log('Missing in EN:', missingInEn.length, missingInEn);
  console.log('Missing in ID:', missingInId.length, missingInId);
} catch (err) {
  console.error('Error parsing dictionary:', err);
}
