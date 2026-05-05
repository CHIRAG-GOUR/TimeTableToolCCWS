import * as xlsx from 'xlsx';
import { 
  MockData, Period, ClassSection, Teacher, Subject, 
  Assignment, HobbyDay, SubjectRatio, HardConstraint, initialMockData
} from '@/data/mockData';

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d{1,2})[:.]\s*(\d{2})/);
  if (!match) return 0;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 7) hours += 12; // PM adjustment for school hours
  return hours * 60 + minutes;
}

/**
 * Parse the bell schedule from the Excel School_Timings sheet.
 * The bell schedule is NEVER modified — it comes exactly from the school's Excel file.
 */
function parseBellSchedule(workbook: xlsx.WorkBook): Period[] {
  const timingSheet = workbook.Sheets['School_Timings'];
  if (!timingSheet) return [];

  const rows = xlsx.utils.sheet_to_json(timingSheet, { header: 1, defval: '' }) as any[][];
  const seenPeriods = new Set<string>();
  const periods: Period[] = [];

  rows.forEach((row) => {
    row.forEach((cell, colIndex) => {
      const val = String(cell).trim();
      
      // Detect period-like entries: "1P", "2P", "LUNCH", "FRUIT", "0P", "WE TIME", etc.
      if (val.match(/^(\d+P|LUNCH|BREAK|FRUIT|0P|MIND|ASSEMBLY|WE TIME)/i)) {
        const nextCell = String(row[colIndex + 1] || '').trim();
        const timeMatch = nextCell.match(/(\d{1,2}[:.]?\s*\d{2})\s*-\s*(\d{1,2}[:.]?\s*\d{2})/);
        if (timeMatch) {
          const id = val.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '').replace(/[^a-z0-9-]/g, '');
          if (!seenPeriods.has(id)) {
            let type: Period['type'] = 'Class';
            if (id.includes('lunch') && !id.includes('fruit')) type = 'Lunch';
            if (id.includes('fruit')) type = 'FruitBreak';
            // Assembly, We Time, Club, etc. are now 'Class' so they can be assigned if needed
            // or at least they don't block the 'Class' filtering logic.

            const cleanName = val.toLowerCase().includes('mindfulness') 
              ? 'Mindfulness (0P)' 
              : val.replace(/\n/g, ' ');

            periods.push({
              id,
              name: cleanName,
              startTime: timeMatch[1].replace('.', ':').replace(/\s+/g, ''),
              endTime: timeMatch[2].replace('.', ':').replace(/\s+/g, ''),
              type
            });
            seenPeriods.add(id);
          }
        }
      }
    });
  });

  // Sort by start time
  periods.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  return periods;
}

// Deterministic colors for subjects so they don't change on every import
const SUBJECT_COLORS: Record<string, string> = {
  'english':    '#6366f1',
  'hindi':      '#ef4444',
  'maths':      '#ec4899',
  'mathematics':'#ec4899',
  'science':    '#14b8a6',
  'sst':        '#f97316',
  'evs':        '#8b5cf6',
  'computer':   '#0ea5e9',
  'reading':    '#a78bfa',
  'games':      '#22c55e',
  'zumba':      '#f43f5e',
  'dance':      '#e879f9',
  'music':      '#fbbf24',
  'art':        '#fb923c',
  'craft':      '#84cc16',
  'yoga':       '#2dd4bf',
  'library':    '#64748b',
  'hobby':      '#c084fc',
  'club':       '#38bdf8',
  'g.k':        '#94a3b8',
  'gk':         '#94a3b8',
  'moral':      '#a3e635',
  'value':      '#a3e635',
  'drawing':    '#fb7185',
  'sanskrit':   '#d946ef',
  'skillizee':  '#a855f7',
  'default':    '#64748b',
};

function getSubjectColor(name: string): string {
  const lower = name.toLowerCase().trim();
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return SUBJECT_COLORS['default'];
}

export async function parseExcelData(file: File): Promise<MockData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = xlsx.read(data, { type: 'array' });
        
        const finalData: MockData = {
          teachers: [],
          subjects: [],
          classes: [],
          bellSchedule: parseBellSchedule(workbook),  // Read from Excel — never modify
          assignments: [],
          timetable: [],
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          hobbyDays: [],
          subjectRatios: [],
          hardConstraints: [...initialMockData.hardConstraints]
        };

        const teacherMap = new Map<string, Teacher>();
        const classMap = new Map<string, ClassSection>();
        const subjectMap = new Map<string, Subject>();

        // ── 1. Classes Master ─────────────────────────────────────────────
        const sheetNames = workbook.SheetNames;
        console.log('[Parser] Sheet Names found:', sheetNames);

        // Flexible sheet detection
        const classesSheetName = sheetNames.find(s => {
          const up = s.toUpperCase();
          return (up.includes('CLASS') && up.includes('MASTER')) || up === 'CLASSES';
        });
        
        const classesSheet = classesSheetName ? workbook.Sheets[classesSheetName] : null;
        if (classesSheet) {
          console.log(`[Parser] Found Classes Master: ${classesSheetName}`);
          const rows = xlsx.utils.sheet_to_json(classesSheet, { header: 1, defval: '' }) as any[][];
          rows.forEach(row => {
            let className = String(row[1] || '').trim().toUpperCase();
            const normalizedClass = className.replace('-', ' ');
            
            if (normalizedClass && normalizedClass.match(/^(II|III|IV|V|VI|VII|VIII|IX|X)\s[A-Z]$/i)) {
              if (!classMap.has(normalizedClass)) {
                classMap.set(normalizedClass, { 
                  id: 'c-' + normalizedClass.toLowerCase().replace(/\s+/g, '-'), 
                  name: normalizedClass 
                });
              }
            }
          });
        }

        // Find the correct teacher sheet. Prioritize the Synopsis sheet if it exists, since it has the real data.
        let teacherSheetName = sheetNames.find(s => s.toUpperCase().includes('SYNOPSIS'));
        if (!teacherSheetName) {
          teacherSheetName = sheetNames.find(s => {
            const up = s.toUpperCase();
            return up.includes('CLASS II-V') || (up.includes('TEACHER') && up.includes('TIMING')) || (up.includes('TEACHER') && up.includes('MASTER'));
          });
        }

        if (classMap.size === 0) {
          console.log('[Parser] No classes found in Master. Using fallback for II-V.');
          const fallbackGrades: Record<string, string[]> = {
            'II': ['A','B','C','D','E','F','G','H'],
            'III': ['A','B','C','D','E','F','G','H','I'],
            'IV': ['A','B','C','D','E','F','G','H','I'],
            'V': ['A','B','C','D','E','F','G','H']
          };
          for (const [g, sections] of Object.entries(fallbackGrades)) {
            for (const s of sections) {
              const name = `${g} ${s}`;
              classMap.set(name, { id: 'c-' + name.toLowerCase().replace(/\s+/g, '-'), name });
            }
          }
        }

        const officialClasses = Array.from(classMap.values()).map(c => c.name);
        const gradeOrder = ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
        officialClasses.sort((a, b) => {
          const [gA, sA] = a.split(' ');
          const [gB, sB] = b.split(' ');
          if (gradeOrder.indexOf(gA) !== gradeOrder.indexOf(gB)) {
            return gradeOrder.indexOf(gA) - gradeOrder.indexOf(gB);
          }
          return sA.localeCompare(sB);
        });

        // ── Class Range Expander ──────────────────────────────────────────
        const expandClassRanges = (input: string): string[] => {
          if (!input) return [];
          let str = input.toUpperCase().replace(/\s+/g, ' ').trim();
          if (str === 'SPECIAL TEACHER' || str === 'SPECIAL') return [];

          str = str.replace(/\s+AND\s+/g, ',').replace(/\s*&\s*/g, ',');
          const parts = str.split(/[,,;]/).map(s => s.trim());
          const result = new Set<string>();

          for (let part of parts) {
            if (!part) continue;
            // Handle II-V or similar
            if (part === 'II-V' || part === 'II - V') {
              officialClasses.filter(c => c.match(/^(II|III|IV|V)/)).forEach(c => result.add(c));
              continue;
            }

            part = part.replace(/^([IVX]+)([^IVX\s])/, '$1 $2');
            
            if (part.includes(' TO ') || part.includes('-')) {
              const ends = part.includes(' TO ') ? part.split(' TO ') : part.split('-');
              let startStr = ends[0].trim().replace(/^([IVX]+)([^IVX\s])/, '$1 $2');
              let endStr = ends[1].trim().replace(/^([IVX]+)([^IVX\s])/, '$1 $2');
              
              let startIndex = officialClasses.indexOf(startStr);
              if (startIndex === -1 && !startStr.includes(' ')) {
                startIndex = officialClasses.findIndex(c => c.startsWith(startStr + ' '));
              }

              let endIndex = officialClasses.indexOf(endStr);
              if (endIndex === -1 && !endStr.includes(' ')) {
                const matches = officialClasses.filter(c => c.startsWith(endStr + ' '));
                if (matches.length > 0) endIndex = officialClasses.indexOf(matches[matches.length - 1]);
              }
              
              if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
                for (let i = startIndex; i <= endIndex; i++) result.add(officialClasses[i]);
              } else {
                if (officialClasses.includes(part)) result.add(part);
                else if (part) result.add(part);
              }
            } else {
              if (officialClasses.includes(part)) result.add(part);
              else if (part) result.add(part);
            }
          }
          return Array.from(result);
        };

        // ── 2. Teachers Master ──────────────────────────────────────────
        let teacherSheetsToProcess: string[] = [];
        
        // Find sheets by exact name match first
        const explicitSheet = sheetNames.find(s => {
          const up = s.toUpperCase();
          return up.includes('SYNOPSIS') || (up.includes('TEACHER') && up.includes('MASTER')) || (up.includes('CLASS II-V'));
        });
        
        if (explicitSheet) {
          teacherSheetsToProcess.push(explicitSheet);
        } else {
          // Dynamic Scan: find any sheet that isn't timing/classes and has teacher/subject columns
          for (const sheetName of sheetNames) {
            const up = sheetName.toUpperCase();
            if (up.includes('TIMING') || sheetName === classesSheetName) continue;
            
            const sheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
            
            let isTeacherSheet = false;
            for (let i = 0; i < Math.min(rows.length, 15); i++) {
              const rowStr = rows[i].map(c => String(c).toUpperCase().trim()).join('|');
              const hasTeacher = rowStr.includes('TEACHER') || rowStr.includes('NAME') || rowStr.includes('INSTRUCTOR') || rowStr.includes('FACULTY');
              const hasSubject = rowStr.includes('SUBJECT') || rowStr.includes('COURSE') || rowStr.includes('TOPIC');
              const hasClass = rowStr.includes('CLASS') || rowStr.includes('SECTION') || rowStr.includes('GRADE');
              
              if ((hasTeacher && hasSubject) || (hasTeacher && hasClass) || (hasSubject && hasClass)) {
                isTeacherSheet = true;
                break;
              }
            }
            if (isTeacherSheet) {
              teacherSheetsToProcess.push(sheetName);
            }
          }
          
          // Ultimate Fallback: Just take the first sheet that isn't excluded
          if (teacherSheetsToProcess.length === 0) {
            const fallbackSheets = sheetNames.filter(s => {
              const up = s.toUpperCase();
              return !up.includes('TIMING') && s !== classesSheetName;
            });
            if (fallbackSheets.length > 0) teacherSheetsToProcess.push(fallbackSheets[0]);
          }
        }

        for (const teacherSheetName of teacherSheetsToProcess) {
          console.log(`[Parser] Processing Teacher Sheet: ${teacherSheetName}`);
          const teacherSheet = workbook.Sheets[teacherSheetName];
          const rows = xlsx.utils.sheet_to_json(teacherSheet, { header: 1, defval: '' }) as any[][];
          
          let headerRowIndex = -1;
          let colIndices = { subject: -1, teacher: -1, classes: -1, total: -1 };

          // Find the header row dynamically
          for (let i = 0; i < Math.min(rows.length, 15); i++) {
            const row = rows[i].map(c => String(c).toUpperCase().trim());
            
            const hasTeacher = row.some(c => c.includes('TEACHER') || c.includes('NAME') || c.includes('INSTRUCTOR') || c.includes('FACULTY'));
            const hasSubject = row.some(c => c.includes('SUBJECT') || c.includes('COURSE') || c.includes('TOPIC'));
            const hasClass = row.some(c => c.includes('CLASS') || c.includes('SECTION') || c.includes('GRADE'));
            
            if (hasTeacher || hasSubject || hasClass) {
              headerRowIndex = i;
              row.forEach((c, idx) => {
                if (c.includes('SUBJECT') || c.includes('COURSE') || c.includes('TOPIC')) {
                  if (colIndices.subject === -1) colIndices.subject = idx;
                }
                if (c.includes('TEACHER') || c.includes('NAME') || c.includes('INSTRUCTOR') || c.includes('FACULTY')) {
                  if (colIndices.teacher === -1) colIndices.teacher = idx;
                }
                if (c.includes('CLASS') || c.includes('SECTION') || c.includes('GRADE')) {
                  if (colIndices.classes === -1) colIndices.classes = idx;
                }
                if (c.includes('TOTAL') || c.includes('PERIOD') || c.includes('HOURS') || c.includes('COUNT')) {
                  if (colIndices.total === -1) colIndices.total = idx;
                }
              });
              console.log(`[Parser] Header detected at row ${i} in ${teacherSheetName}. Indices:`, colIndices);
              break;
            }
          }

          if (headerRowIndex === -1 || (colIndices.teacher === -1 && colIndices.subject === -1)) {
            console.warn(`[Parser] Falling back to default column indices for ${teacherSheetName}.`);
            colIndices = { subject: 1, teacher: 2, classes: 3, total: 4 };
            headerRowIndex = 1;
          } else {
            // Fill missing with logical defaults
            if (colIndices.teacher === -1) colIndices.teacher = 2;
            if (colIndices.subject === -1) colIndices.subject = 1;
            if (colIndices.classes === -1) colIndices.classes = 3;
            if (colIndices.total === -1) colIndices.total = 4;
          }

          rows.forEach((row, rowIndex) => {
            if (rowIndex <= headerRowIndex) return;

            let teacherName = String(row[colIndices.teacher] || '').trim().toUpperCase();
            let subjectsStr = String(row[colIndices.subject] || '').trim().toUpperCase();
            const classesStr = String(row[colIndices.classes] || '').trim();
            const totalVal = row[colIndices.total];
            const total = parseInt(String(totalVal || '0')) || 0;

            if (!teacherName || teacherName === 'TEACHERS NAME' || teacherName === 'SUBJECT' || teacherName === 'NAME') return;
            if (teacherName.includes('S.NO') || teacherName === 'S.NO.' || teacherName.match(/^[0-9]+$/)) return;
            if (subjectsStr === 'SUBJECT') return;

            const commonSubjects = ['ENGLISH', 'MATHS', 'SCIENCE', 'HINDI', 'READING', 'COMPUTER', 'DRAWING', 'LIBRARY', 'GAMES', 'DANCE', 'MUSIC', 'ROBOTICS', 'SST', 'G.K.', 'HOBBY', 'ZUMBA', 'EVS'];
            if (commonSubjects.some(sub => teacherName.includes(sub)) && !teacherName.includes('MR') && !teacherName.includes('MS')) {
              const otherVal = String(row[colIndices.subject] || '').trim().toUpperCase();
              if (otherVal && (otherVal.includes('MS.') || otherVal.includes('MR.') || otherVal.includes('MRS.') || otherVal.split(' ').length > 1)) {
                [teacherName, subjectsStr] = [otherVal, teacherName];
              } else if (otherVal && teacherName) {
                [teacherName, subjectsStr] = [otherVal, teacherName];
              }
            }

            if (!teacherName || !subjectsStr) return;

            const tId = 't-' + teacherName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '');
            const subjects = subjectsStr.split(/[,/&]/).map(s => s.trim().toUpperCase()).filter(Boolean);

            if (!teacherMap.has(tId)) {
              teacherMap.set(tId, {
                id: tId,
                name: teacherName,
                maxHoursPerWeek: total || 30,
                subjects: [...subjects]
              });
            } else {
              const t = teacherMap.get(tId)!;
              subjects.forEach(s => {
                if (!t.subjects.includes(s)) t.subjects.push(s);
              });
              if (total > 0) t.maxHoursPerWeek = Math.max(t.maxHoursPerWeek, total);
            }

            const foundClasses = expandClassRanges(classesStr);
            if (foundClasses.length > 0) {
              subjects.forEach(subName => {
                const subId = 'sub-' + subName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

                if (!subjectMap.has(subName)) {
                  subjectMap.set(subName, {
                    id: subId,
                    name: subName,
                    color: getSubjectColor(subName),
                    isAllenBlock: false
                  });
                }

                const periodsPerSection = Math.round(total / (foundClasses.length * subjects.length)) || 6;

                foundClasses.forEach(cName => {
                  const classId = 'c-' + cName.toLowerCase().replace(/\s+/g, '-');
                  
                  // Ensure class exists in map if dynamically found
                  if (!classMap.has(cName)) {
                    classMap.set(cName, { id: classId, name: cName });
                    if (!officialClasses.includes(cName)) officialClasses.push(cName);
                  }
                  
                  finalData.assignments.push({
                    id: `asgn-${tId}-${subId}-${classId}`,
                    classId,
                    subjectId: subId,
                    teacherId: tId,
                    periodsPerWeek: periodsPerSection
                  });
                });
              });
            }
          });
        }

        // ── 3. Finalize ──────────────────────────────────────────────────
        finalData.teachers = Array.from(teacherMap.values());
        finalData.classes = Array.from(classMap.values()).sort((a,b) => {
          const [gA, sA] = a.name.split(' ');
          const [gB, sB] = b.name.split(' ');
          if (gradeOrder.indexOf(gA) !== gradeOrder.indexOf(gB)) {
            return gradeOrder.indexOf(gA) - gradeOrder.indexOf(gB);
          }
          return sA.localeCompare(sB);
        });

        const foundSubjects = Array.from(subjectMap.values());
        finalData.subjects = foundSubjects;

        // ── 4. Diagnostic Logging ────────────────────────────────────────
        console.log(`[Parser] Classes: ${finalData.classes.length}`);
        console.log(`[Parser] Teachers: ${finalData.teachers.length}`);
        console.log(`[Parser] Subjects: ${finalData.subjects.length}`);
        console.log(`[Parser] Assignments: ${finalData.assignments.length}`);
        console.log(`[Parser] Bell Schedule: ${finalData.bellSchedule.length} slots (${finalData.bellSchedule.filter(p => p.type === 'Class').length} teaching periods)`);
        
        // Per-class summary
        const classTotals = new Map<string, number>();
        finalData.assignments.forEach(a => {
          classTotals.set(a.classId, (classTotals.get(a.classId) || 0) + a.periodsPerWeek);
        });
        const teachingPeriods = finalData.bellSchedule.filter(p => p.type === 'Class').length;
        const maxPerWeek = teachingPeriods * finalData.days.length; // 10 periods × 6 days = 60
        console.log(`[Parser] Max slots per class per week: ${maxPerWeek}`);
        classTotals.forEach((total, classId) => {
          const pct = Math.round((total / maxPerWeek) * 100);
          if (pct < 80) {
            console.warn(`[Parser] ⚠ ${classId}: only ${total}/${maxPerWeek} periods assigned (${pct}%). Timetable will have empty slots.`);
          }
        });

        resolve(finalData);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
