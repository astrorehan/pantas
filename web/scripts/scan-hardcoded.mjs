import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '../src');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (!file.endsWith('.test.ts') && !file.endsWith('.generated.ts') && !fullPath.includes('i18n\\messages')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = getFiles(srcDir);

let report = {};

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(srcDir, filePath);

  // Ignore dev gallery or pure mock data files
  if (relPath.startsWith('app\\dev') || relPath.includes('data.ts')) return;

  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('import ')) return;

    // Check if line has hardcoded Indonesian text (words like 'atau', 'dengan', 'dan', 'oleh', 'untuk', 'yang', 'pada', 'bisa', 'saat', 'sudah', 'belum', 'silakan', 'lihat', 'buka', 'hapus', 'batal', 'simpan', 'ubah')
    const hasIndoWord = /\b(dan|atau|dengan|oleh|untuk|yang|pada|bisa|saat|sudah|belum|silakan|lihat|buka|hapus|batal|simpan|ubah|kembali|lanjut|tutup|pilih|semua|rute|stok|harga|pesanan|penawaran|listing|beranda|riwayat|dampak|akun|peta|logistik|timbangan|hasil|koin|pindai|panen|pembeli|petani)\b/i.test(line);

    if (hasIndoWord) {
      // Exclude lines calling t(...) or comments
      if (!/\bt\(/i.test(line) && !/\btc\(/i.test(line) && !/\btNav\(/i.test(line) && !/\buseTranslations\b/.test(line)) {
        if (!report[relPath]) report[relPath] = [];
        report[relPath].push({ line: idx + 1, text: trimmed });
      }
    }
  });
});

console.log(`\n=== FULL I18N AUDIT REPORT ===`);
let totalLines = 0;
Object.entries(report).forEach(([file, items]) => {
  console.log(`\n📄 ${file} (${items.length} gaps):`);
  items.slice(0, 10).forEach(item => {
    console.log(`   L${item.line}: ${item.text}`);
  });
  if (items.length > 10) {
    console.log(`   ... and ${items.length - 10} more lines`);
  }
  totalLines += items.length;
});

console.log(`\nTOTAL UNTRANSLATED LINES FOUND: ${totalLines} across ${Object.keys(report).length} files.`);
