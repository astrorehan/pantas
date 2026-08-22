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
      if (!file.endsWith('.test.ts') && !file.endsWith('.generated.ts') && !fullPath.includes('i18n\\messages') && !fullPath.includes('app\\dev')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = getFiles(srcDir);

// Indonesian keywords commonly found in hardcoded UI text
const UI_INDO_WORDS = [
  "Belum ada", "Tidak ada", "Mulai", "Kembali", "Lanjut", "Simpan", "Batal", "Hapus", "Ubah",
  "Tutup", "Pilih", "Cari", "Semua", "Terbitkan", "Saring", "Jual", "Mulai pindai", "Buka laporan",
  "Nilai lot", "Stok siap", "Tawaran", "Pesanan", "Riwayat", "Dampak", "Konsolidasi", "Rute",
  "Rupiah", "Hapus listing", "Ubah harga", "Obrolan", "Penawaran masuk", "Pesanan masuk",
  "Hasil pindai", "Terakhir", "Status", "Kategori", "Detail", "Beri ulasan", "Perkiraan"
];

const regex = new RegExp(`\\b(${UI_INDO_WORDS.join('|')})\\b`, 'i');

let uiIssues = {};

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(srcDir, filePath);
  
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    // Skip comments and imports
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('import ')) return;
    
    // Check if line has UI text matching our pattern and does NOT use t( or tNav( or tc(
    if (regex.test(line)) {
      if (!/\bt\s*\(/i.test(line) && !/\btc\s*\(/i.test(line) && !/\btNav\s*\(/i.test(line) && !/useTranslations/.test(line)) {
        if (!uiIssues[relPath]) uiIssues[relPath] = [];
        uiIssues[relPath].push({ line: idx + 1, text: trimmed });
      }
    }
  });
});

console.log("\n==========================================");
console.log("   UI HARDCODED INDONESIAN TEXT AUDIT     ");
console.log("==========================================\n");

let total = 0;
Object.entries(uiIssues).forEach(([file, items]) => {
  console.log(`📌 ${file} (${items.length} occurrences):`);
  items.forEach(item => {
    console.log(`   Line ${item.line}: ${item.text}`);
  });
  total += items.length;
  console.log("");
});

console.log(`TOTAL UI HARDCODED OCCURRENCES: ${total} across ${Object.keys(uiIssues).length} files.`);
