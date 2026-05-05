const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('school_data.xlsx');
console.log('Sheets found:', workbook.SheetNames);

const output = {};
workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  output[sheetName] = xlsx.utils.sheet_to_json(sheet, { defval: '' });
});

fs.writeFileSync('school_data_parsed.json', JSON.stringify(output, null, 2));
console.log('Saved to school_data_parsed.json');
