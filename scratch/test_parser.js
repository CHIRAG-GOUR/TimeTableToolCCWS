const xlsx = require('xlsx');

function testParsing(wb, officialClasses) {
  const teacherMap = new Map();
  const subjectMap = new Map();
  const assignments = [];
  
  const sheetNames = wb.SheetNames;
  
  const explicitSheet = sheetNames.find(s => {
    const up = s.toUpperCase();
    return up.includes('SYNOPSIS') || (up.includes('TEACHER') && up.includes('MASTER')) || up.includes('CLASS II-V');
  });
  
  const teacherSheetsToProcess = explicitSheet ? [explicitSheet] : [];
  
  const expandClassRanges = (input) => {
    if (!input) return [];
    let str = input.toUpperCase().replace(/\s+/g, ' ').trim();
    str = str.replace(/\s+AND\s+/g, ',').replace(/\s*&\s*/g, ',');
    const parts = str.split(/[,，;]/).map(s => s.trim());
    const result = new Set();
    
    for (let part of parts) {
      if (!part) continue;
      if (part === 'II-V' || part === 'II - V') {
        officialClasses.filter(c => c.match(/^(II|III|IV|V)\s/)).forEach(c => result.add(c));
        continue;
      }
      part = part.replace(/^([IVX]+)([^IVX\s])/, '$1 $2');
      if (part.includes(' TO ') || part.includes('-')) {
        const ends = part.includes(' TO ') ? part.split(' TO ') : part.split('-');
        let startStr = ends[0].trim().replace(/^([IVX]+)([^IVX\s])/, '$1 $2');
        let endStr = ends[1].trim().replace(/^([IVX]+)([^IVX\s])/, '$1 $2');
        let startIndex = officialClasses.indexOf(startStr);
        if (startIndex === -1 && !startStr.includes(' ')) startIndex = officialClasses.findIndex(c => c.startsWith(startStr + ' '));
        let endIndex = officialClasses.indexOf(endStr);
        if (endIndex === -1 && !endStr.includes(' ')) {
          const matches = officialClasses.filter(c => c.startsWith(endStr + ' '));
          if (matches.length > 0) endIndex = officialClasses.indexOf(matches[matches.length - 1]);
        }
        if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
          for (let i = startIndex; i <= endIndex; i++) result.add(officialClasses[i]);
        } else {
          if (officialClasses.includes(part)) result.add(part);
        }
      } else {
        if (officialClasses.includes(part)) result.add(part);
      }
    }
    return Array.from(result);
  };

  const commonSubjects = ['ENGLISH', 'MATHS', 'SCIENCE', 'HINDI', 'READING', 'COMPUTER', 'DRAWING', 'LIBRARY', 'GAMES', 'DANCE', 'MUSIC', 'ROBOTICS', 'SST', 'G.K.', 'HOBBY', 'ZUMBA'];

  for (const teacherSheetName of teacherSheetsToProcess) {
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[teacherSheetName], { header: 1, defval: '' });
    let colIndices = { subject: -1, teacher: -1, classes: -1, total: -1 };
    let inDataBlock = false;

    rows.forEach((r, rowIndex) => {
      const row = r.map(c => String(c).toUpperCase().trim());
      const rowStr = row.join('|');

      if (rowStr.includes('SUBJECT') && (rowStr.includes('TEACHER') || rowStr.includes('NAME'))) {
        colIndices = { subject: -1, teacher: -1, classes: -1, total: -1 };
        row.forEach((c, idx) => {
          if (c === 'SUBJECT') colIndices.subject = idx;
          else if (c.includes('SUBJECT') && colIndices.subject === -1) colIndices.subject = idx;
          if (c.includes('TEACHER') && c.includes('NAME')) colIndices.teacher = idx;
          else if (c.includes('TEACHER') && colIndices.teacher === -1) colIndices.teacher = idx;
          else if (c === 'NAME' && colIndices.teacher === -1) colIndices.teacher = idx;
          if (c.includes('CLASS') || c.includes('SECTION')) colIndices.classes = idx;
          if (c.includes('TOTAL') || c.includes('PERIOD')) colIndices.total = idx;
        });
        if (colIndices.subject === -1) colIndices.subject = row.findIndex(c => c.includes('SUBJECT'));
        if (colIndices.teacher === -1) colIndices.teacher = row.findIndex(c => c.includes('NAME') || c.includes('TEACHER'));
        inDataBlock = true;
        console.log(`\nFound Header at row ${rowIndex}:`, colIndices);
        return;
      }

      if (!inDataBlock) return;
      if (colIndices.teacher === -1 || colIndices.subject === -1 || colIndices.classes === -1) return;

      let teacherName = String(r[colIndices.teacher] || '').trim().toUpperCase();
      let subjectsStr = String(r[colIndices.subject] || '').trim().toUpperCase();
      const classesStr = String(r[colIndices.classes] || '').trim();
      const total = parseInt(String(r[colIndices.total] || '0')) || 0;

      if (!teacherName || teacherName === 'TEACHERS NAME' || teacherName === 'SUBJECT' || teacherName === 'NAME') return;
      if (teacherName.includes('S.NO') || teacherName === 'S.NO.') return;
      if (subjectsStr === 'SUBJECT') return;

      if (commonSubjects.includes(teacherName)) {
        const otherVal = String(r[colIndices.subject] || '').trim().toUpperCase();
        if (otherVal.includes('MS.') || otherVal.includes('MR.') || otherVal.includes('MRS.')) {
          [teacherName, subjectsStr] = [otherVal, teacherName];
        } else {
          return;
        }
      }

      if (!teacherName || !subjectsStr) return;

      const foundClasses = expandClassRanges(classesStr);
      if (foundClasses.length > 0) {
        console.log(`Parsed -> Teacher: ${teacherName}, Subject: ${subjectsStr}, Classes: ${foundClasses.join(',')}`);
        assignments.push({ teacherName, subjectsStr, foundClasses });
      } else {
        console.log(`Skipped (No classes) -> Teacher: ${teacherName}, Subject: ${subjectsStr}, ClassStr: ${classesStr}`);
      }
    });
  }
  console.log(`Total assignments: ${assignments.length}`);
}

(async () => {
  const officialClasses = [
    'II A', 'II B', 'II C', 'II D', 'II E', 'II F', 'II G', 'II H',
    'III A', 'III B', 'III C', 'III D', 'III E', 'III F', 'III G', 'III H', 'III I',
    'IV A', 'IV B', 'IV C', 'IV D', 'IV E', 'IV F', 'IV G', 'IV H', 'IV I',
    'V A', 'V B', 'V C', 'V D', 'V E', 'V F', 'V G', 'V H',
    'IX A', 'IX B', 'X A', 'X B', 'XI A', 'XI B', 'XII A', 'XII B'
  ];

  console.log('Testing ORIGINAL SHEET:');
  const res = await fetch('https://docs.google.com/spreadsheets/d/1ThKYJWthF5NOvbPcS-OYNniZhyJH8_v3uYygAPX8aW8/export?format=xlsx', { redirect: 'follow' });
  const buf = Buffer.from(await res.arrayBuffer());
  const wb = xlsx.read(buf);
  testParsing(wb, officialClasses);
})();
