import * as xlsx from 'xlsx';
const wb = xlsx.utils.book_new();
const ws = xlsx.utils.aoa_to_sheet([
  ['CLASS II-V (SYNOPSIS)'],
  ['S.NO.', 'SUBJECT', 'TEACHERS NAME', 'CLASSES & SECTION', 'TOTAL'],
  [1, 'ENGLISH', 'MS. SHALINI SINGH', 'II A, II B', 18]
]);
xlsx.utils.book_append_sheet(wb, ws, 'Teachers_Master');
xlsx.writeFile(wb, 'dummy.xlsx');
