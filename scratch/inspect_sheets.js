const xlsx = require('xlsx');
const fs = require('fs');

async function fetchAndParse(sheetId, label) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
  let out = `\nFetching ${label}...\n`;
  
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    out += `  FAILED: HTTP ${res.status}\n`;
    return out;
  }
  
  const buf = Buffer.from(await res.arrayBuffer());
  const wb = xlsx.read(buf);
  
  out += `${'='.repeat(60)}\n`;
  out += `${label}\n`;
  out += `Sheets: ${wb.SheetNames.join(', ')}\n`;
  out += `${'='.repeat(60)}\n`;
  
  wb.SheetNames.forEach(name => {
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' });
    out += `\n--- ${name} --- (${rows.length} rows)\n`;
    rows.slice(0, 30).forEach((row, i) => {
      const vals = row.map(c => String(c).trim()).filter(Boolean);
      if (vals.length > 0) {
        out += `  Row ${i}: ${vals.join(' | ')}\n`;
      }
    });
  });
  return out;
}

(async () => {
  const out1 = await fetchAndParse('1VzTfeEJYtONuFRmZXLiyel18L1y9c-zqCKpN2OwP0f4', 'DEMO SHEET');
  const out2 = await fetchAndParse('1ThKYJWthF5NOvbPcS-OYNniZhyJH8_v3uYygAPX8aW8', 'SCHOOL ORIGINAL SHEET');
  fs.writeFileSync('scratch/inspect_output_2.txt', out1 + out2, 'utf8');
})();
