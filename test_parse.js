import * as xlsx from 'xlsx';
import fs from 'fs';
import { dirname } from 'path';

// Fix for Node.js usage of xlsx
xlsx.set_fs(fs);

const workbook = xlsx.readFile('dummy.xlsx');
const teacherSheet = workbook.Sheets['Teachers_Master'];
const rows = xlsx.utils.sheet_to_json(teacherSheet, { header: 1, defval: '' });

let capturing = false;
let assignments = [];

rows.forEach(row => {
  const rowStr = row.join(' ').toUpperCase();
  if (rowStr.includes('SYNOPSIS') || rowStr.includes('CLASS II-V')) {
    capturing = true;
    return;
  }
  if (capturing) {
    let name = '';
    row.forEach(cell => {
      const cellVal = String(cell).trim().toUpperCase();
      if (cellVal.match(/^(MS|MR|MRS)\.?\s/i) || cellVal.startsWith('MS.') || cellVal.startsWith('MR.')) {
        name = cellVal;
      }
    });

    const subjectsStr = String(row[1] || '').trim();
    const classesStr = String(row[3] || '').trim();
    const total = parseInt(String(row[4] || '0'));

    if (name) {
      console.log('Found teacher:', name);
      const foundClasses = classesStr.split(',').map(c => c.trim()).filter(c => c);
      const isRelevant = foundClasses.some(c => c.match(/^(II|III|IV|V)/i)) || classesStr.toUpperCase().includes('II-V') || classesStr.toUpperCase().includes('SPECIAL');
      
      console.log('Classes:', foundClasses, 'IsRelevant:', isRelevant);
      
      if (isRelevant) {
        foundClasses.forEach(cName => {
          assignments.push({ teacher: name, class: cName, subject: subjectsStr });
        });
      }
    }
  }
});

console.log('Assignments generated:', assignments);
