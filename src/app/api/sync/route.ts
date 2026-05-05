import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { getDataStore, updateDataStore, MockData, initialMockData } from '@/data/mockData';

// ── Helper functions (duplicated from excelParser for server-side use) ──

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d{1,2})[:.]\s*(\d{2})/);
  if (!match) return 0;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 7) hours += 12;
  return hours * 60 + minutes;
}

const SUBJECT_COLORS: Record<string, string> = {
  'english': '#6366f1', 'hindi': '#ef4444', 'maths': '#ec4899',
  'mathematics': '#ec4899', 'science': '#14b8a6', 'sst': '#f97316',
  'evs': '#8b5cf6', 'computer': '#0ea5e9', 'reading': '#a78bfa',
  'games': '#22c55e', 'zumba': '#f43f5e', 'dance': '#e879f9',
  'music': '#fbbf24', 'art': '#fb923c', 'craft': '#84cc16',
  'yoga': '#2dd4bf', 'library': '#64748b', 'hobby': '#c084fc',
  'club': '#38bdf8', 'g.k': '#94a3b8', 'gk': '#94a3b8',
  'moral': '#a3e635', 'value': '#a3e635', 'drawing': '#fb7185',
  'sanskrit': '#d946ef', 'skillizee': '#a855f7', 'default': '#64748b',
  'robotic': '#06b6d4', 'robotics': '#06b6d4', 'swimming': '#0284c7',
  'life skill': '#10b981', 'presen. skill': '#8b5cf6', 'theatre': '#e879f9',
  'news': '#94a3b8', 'sans': '#d946ef', 'french': '#d946ef',
};

function getSubjectColor(name: string): string {
  const lower = name.toLowerCase().trim();
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return SUBJECT_COLORS['default'];
}

type Period = { id: string; name: string; startTime: string; endTime: string; type: 'Class' | 'Break' | 'Lunch' | 'FruitBreak'; };

function parseBellSchedule(workbook: xlsx.WorkBook): Period[] {
  // Find the Bell Schedule sheet dynamically
  const possibleNames = ['Bell Schedule', 'Bell_Schedule', 'School_Timings', 'Timings'];
  let timingSheet: xlsx.WorkSheet | null = null;
  for (const name of possibleNames) {
    if (workbook.Sheets[name]) { timingSheet = workbook.Sheets[name]; break; }
  }
  if (!timingSheet) {
    const match = workbook.SheetNames.find(s =>
      s.toUpperCase().includes('BELL') || s.toUpperCase().includes('TIMING')
    );
    if (match) timingSheet = workbook.Sheets[match];
  }
  if (!timingSheet) {
    console.log('[ServerParser] No bell schedule sheet found');
    return [];
  }

  // ── Step 1: Extract ALL raw period entries from the sheet ──
  const rows = xlsx.utils.sheet_to_json(timingSheet, { header: 1, defval: '' }) as any[][];
  const rawEntries: { label: string; start: string; end: string; startMins: number; endMins: number; duration: number }[] = [];

  for (const row of rows) {
    // Search ALL columns for a period label (1P, 2P, etc.)
    let labelIndex = -1;
    let timingIndex = -1;

    for (let i = 0; i < row.length; i++) {
      const cellVal = String(row[i] || '').trim();
      if (cellVal.match(/^(\d+P|FIRST\s+0P|LUNCH|FRUIT|WE\s*TIME)/i)) {
        labelIndex = i;
        // The timing is usually in the next non-empty column
        for (let j = i + 1; j < Math.min(i + 5, row.length); j++) {
          const tCell = String(row[j] || '').trim();
          if (tCell.match(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/)) {
            timingIndex = j;
            break;
          }
        }
        if (labelIndex !== -1 && timingIndex !== -1) {
          const label = String(row[labelIndex]).trim();
          const timingCell = String(row[timingIndex]).trim();
          const timeMatch = timingCell.match(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/);
          if (timeMatch) {
            const start = timeMatch[1].replace('.', ':');
            const end = timeMatch[2].replace('.', ':');
            const startMins = timeToMinutes(start);
            const endMins = timeToMinutes(end);
            rawEntries.push({ label, start, end, startMins, endMins, duration: endMins - startMins });
          }
        }
      }
    }
  }

  console.log(`[ServerParser] Raw bell entries found: ${rawEntries.length}`);

  const MIN_TEACHING = 40;            // Minimum 40 min per teaching period
  const periods: Period[] = [];
  const seenIds = new Set<string>();

  // Find specific entries from parsed data
  const findEntry = (keyword: string) => rawEntries.find(e => e.label.toUpperCase().includes(keyword));
  const findPeriod = (num: number) => rawEntries.find(e => {
    const m = e.label.match(/^(\d+)P$/i);
    return m && parseInt(m[1]) === num;
  });

  // Mindfulness for juniors (0P II-VII): 9:30-9:50
  const mindfulness = rawEntries.find(e => 
    e.label.toUpperCase().includes('II-VII') && 
    (e.label.toUpperCase().includes('0P') || e.label.toUpperCase().includes('MINDFULNESS'))
  );
  if (mindfulness) {
    periods.push({ id: 'mindfulness', name: 'Mindfulness', startTime: mindfulness.start, endTime: mindfulness.end, type: 'Break' });
  }

  // Teaching periods 3P through 10P (exactly 8 periods)
  let fruitBreakEnd = 0; // Track when fruit break ends so we can adjust 8P
  
  // First, find and store the fruit break timing
  const fruitEntry = rawEntries.find(e => e.label.toUpperCase().includes('FRUIT'));
  if (fruitEntry) {
    fruitBreakEnd = fruitEntry.endMins;
  }

  for (let pNum = 3; pNum <= 10; pNum++) {
    const entry = findPeriod(pNum);
    if (!entry) {
      console.log(`[ServerParser] Warning: Period ${pNum}P not found in bell schedule`);
      continue;
    }

    let adjustedStart = entry.start;
    let adjustedStartMins = entry.startMins;

    // Fix 8P: if it overlaps with fruit break, start it after fruit break ends
    if (pNum === 8 && fruitBreakEnd > 0 && entry.startMins < fruitBreakEnd) {
      const h = Math.floor(fruitBreakEnd / 60);
      const m = fruitBreakEnd % 60;
      adjustedStart = `${h > 12 ? h - 12 : h}:${m.toString().padStart(2, '0')}`;
      adjustedStartMins = fruitBreakEnd;
      console.log(`[ServerParser] Adjusted 8P start: ${entry.start} → ${adjustedStart} (after fruit break)`);
    }

    const duration = entry.endMins - adjustedStartMins;
    if (duration < MIN_TEACHING) {
      console.log(`[ServerParser] Warning: ${pNum}P is only ${duration}min (< ${MIN_TEACHING}min minimum), keeping anyway`);
    }

    const id = pNum + 'p';
    if (!seenIds.has(id)) {
      seenIds.add(id);
      periods.push({ id, name: pNum + 'P', startTime: adjustedStart, endTime: entry.end, type: 'Class' });
    }
  }

  // Lunch (Fixed)
  periods.push({ id: 'lunch', name: 'LUNCH', startTime: '11:20', endTime: '11:40', type: 'Lunch' });

  // Fruit Break (Fixed)
  periods.push({ id: 'fruit-break', name: 'FRUIT BREAK', startTime: '02:00', endTime: '02:10', type: 'FruitBreak' });

  // Sort everything by start time
  periods.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // Log final schedule
  const teachingPeriods = periods.filter(p => p.type === 'Class');
  console.log(`[ServerParser] Junior Bell Schedule: ${periods.length} total slots, ${teachingPeriods.length} teaching periods`);
  periods.forEach(p => {
    const dur = timeToMinutes(p.endTime) - timeToMinutes(p.startTime);
    console.log(`  ${p.name.padEnd(16)} ${p.startTime}-${p.endTime} (${dur}min) [${p.type}]`);
  });

  if (teachingPeriods.length !== 8) {
    console.warn(`[ServerParser] ⚠ Expected 8 teaching periods, got ${teachingPeriods.length}`);
  }

  return periods;
}

// ── Parse HOBBY DAYS from the bell schedule sheet ──
interface HobbySlot { periodId: string; grades: string[]; days: string[]; }

function parseHobbyDays(workbook: xlsx.WorkBook): HobbySlot[] {
  // Find the bell schedule sheet
  const possibleNames = ['Bell Schedule', 'Bell_Schedule', 'School_Timings', 'Timings'];
  let timingSheet: xlsx.WorkSheet | null = null;
  for (const name of possibleNames) {
    if (workbook.Sheets[name]) { timingSheet = workbook.Sheets[name]; break; }
  }
  if (!timingSheet) {
    const match = workbook.SheetNames.find(s =>
      s.toUpperCase().includes('BELL') || s.toUpperCase().includes('TIMING')
    );
    if (match) timingSheet = workbook.Sheets[match];
  }
  if (!timingSheet) return [];

  const rows = xlsx.utils.sheet_to_json(timingSheet, { header: 1, defval: '' }) as any[][];
  const slots: HobbySlot[] = [];

  // Find the row with "HOBBY DAYS" header
  let hobbyHeaderRow = -1;
  let periodCol = -1, mwfCol = -1, ttsCol = -1;

  for (let i = 0; i < rows.length; i++) {
    const rowStr = rows[i].map((c: any) => String(c).toUpperCase().trim()).join('|');
    if (rowStr.includes('HOBBY DAY') || rowStr.includes('HOBBY DAYS')) {
      // The header with column labels is usually the next row or this row
      // Check if this row has PERIOD/M/W/F columns
      const cells = rows[i].map((c: any) => String(c).toUpperCase().trim());
      const hasPeriod = cells.some(c => c.includes('PERIOD'));
      if (hasPeriod) {
        hobbyHeaderRow = i;
      } else if (i + 1 < rows.length) {
        hobbyHeaderRow = i + 1;
      }
      break;
    }
  }

  if (hobbyHeaderRow === -1) {
    // Try finding column headers directly: PERIOD + M/W/F + T/T/S in same row
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].map((c: any) => String(c).toUpperCase().trim());
      const hasP = cells.some(c => c === 'PERIOD');
      const hasMWF = cells.some(c => c.includes('M/W/F') || c.includes('MWF'));
      const hasTTS = cells.some(c => c.includes('T/T/S') || c.includes('TTS'));
      if (hasP && hasMWF && hasTTS) {
        hobbyHeaderRow = i;
        break;
      }
    }
  }

  if (hobbyHeaderRow === -1) {
    console.log('[ServerParser] No HOBBY DAYS section found in bell schedule');
    return [];
  }

  // Map column indices from header row
  const hdrCells = rows[hobbyHeaderRow].map((c: any) => String(c).toUpperCase().trim());
  hdrCells.forEach((c: string, idx: number) => {
    if (c === 'PERIOD' && periodCol === -1) periodCol = idx;
    if ((c.includes('M/W/F') || c.includes('MWF')) && mwfCol === -1) mwfCol = idx;
    if ((c.includes('T/T/S') || c.includes('TTS')) && ttsCol === -1) ttsCol = idx;
  });

  // If column headers weren't on hobby header row, look within nearby rows
  if (periodCol === -1) {
    // Use positional defaults based on the HOBBY DAYS section (columns D,F,G in the screenshot)
    for (let i = hobbyHeaderRow; i >= Math.max(0, hobbyHeaderRow - 2); i--) {
      const cells = rows[i].map((c: any) => String(c).toUpperCase().trim());
      cells.forEach((c: string, idx: number) => {
        if (c === 'PERIOD' && periodCol === -1) periodCol = idx;
        if ((c.includes('M/W/F') || c.includes('MWF')) && mwfCol === -1) mwfCol = idx;
        if ((c.includes('T/T/S') || c.includes('TTS')) && ttsCol === -1) ttsCol = idx;
      });
    }
  }

  console.log(`[ServerParser] Hobby Days header at row ${hobbyHeaderRow}. Cols: period=${periodCol}, mwf=${mwfCol}, tts=${ttsCol}`);

  if (periodCol === -1 || (mwfCol === -1 && ttsCol === -1)) return [];

  const mwfDays = ['Monday', 'Wednesday', 'Friday'];
  const ttsDays = ['Tuesday', 'Thursday', 'Saturday'];

  // Read data rows after the header
  for (let i = hobbyHeaderRow + 1; i < rows.length; i++) {
    const pCell = String(rows[i][periodCol] || '').trim().toUpperCase();
    if (!pCell.match(/^\d+P$/)) {
      if (pCell && !pCell.includes('PERIOD')) continue;
      if (!pCell) break; // Empty = end of section
      continue;
    }

    const periodId = pCell.toLowerCase(); // e.g. "4p"
    const mwfGrades = mwfCol >= 0 ? String(rows[i][mwfCol] || '').trim().toUpperCase() : '';
    const ttsGrades = ttsCol >= 0 ? String(rows[i][ttsCol] || '').trim().toUpperCase() : '';

    // Parse grade strings like "II", "IX-X", "V" into grade prefixes
    const parseGrades = (g: string): string[] => {
      if (!g) return [];
      const gradeOrder = ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
      const parts = g.replace(/\s+AND\s+/g, ',').replace(/\s*&\s*/g, ',').split(/[,;]/).map(s => s.trim());
      const result: string[] = [];
      for (const p of parts) {
        if (!p) continue;
        if (p.includes('-')) {
          const [s, e] = p.split('-').map(x => x.trim());
          const si = gradeOrder.indexOf(s);
          const ei = gradeOrder.indexOf(e);
          if (si !== -1 && ei !== -1) {
            for (let j = si; j <= ei; j++) result.push(gradeOrder[j]);
          } else {
            result.push(p);
          }
        } else if (gradeOrder.includes(p)) {
          result.push(p);
        }
      }
      return result;
    };

    if (mwfGrades) {
      slots.push({ periodId, grades: parseGrades(mwfGrades), days: mwfDays });
    }
    if (ttsGrades) {
      slots.push({ periodId, grades: parseGrades(ttsGrades), days: ttsDays });
    }
  }

  console.log(`[ServerParser] Parsed ${slots.length} hobby slot rules:`);
  slots.forEach(s => console.log(`  ${s.periodId}: grades [${s.grades.join(',')}] on [${s.days.join(',')}]`));
  return slots;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sheetId } = body;

    if (!sheetId) {
      return NextResponse.json({ success: false, error: 'No sheet ID provided' }, { status: 400 });
    }

    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
    console.log(`[ServerSync] Downloading sheet: ${sheetId}`);

    const response = await fetch(exportUrl, { redirect: 'follow' });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Failed to download Google Sheet (HTTP ${response.status}). Make sure the sheet sharing is set to "Anyone with the link can view".`
      }, { status: 400 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = xlsx.read(data, { type: 'array' });

    console.log('[ServerParser] Sheet names:', workbook.SheetNames);

    // ── Build MockData ──
    const finalData: MockData = {
      teachers: [],
      subjects: [],
      classes: [],
      bellSchedule: parseBellSchedule(workbook),
      assignments: [],
      timetable: [],
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      hobbyDays: (() => {
        const hobbySlots = parseHobbyDays(workbook);
        const result: { periodId: string; day: string; classRange: string }[] = [];
        for (const slot of hobbySlots) {
          for (const day of slot.days) {
            for (const grade of slot.grades) {
              result.push({ periodId: slot.periodId, day, classRange: grade });
            }
          }
        }
        return result;
      })(),
      subjectRatios: [],
      hardConstraints: [...initialMockData.hardConstraints]
    };

    const teacherMap = new Map<string, any>();
    const classMap = new Map<string, any>();
    const subjectMap = new Map<string, any>();

    // ── 1. Classes Master ──
    const sheetNames = workbook.SheetNames;
    const classesSheetName = sheetNames.find(s => {
      const up = s.toUpperCase();
      return (up.includes('CLASS') && up.includes('MASTER')) || up === 'CLASSES';
    });

    if (classesSheetName) {
      const rows = xlsx.utils.sheet_to_json(workbook.Sheets[classesSheetName], { header: 1, defval: '' }) as any[][];
      rows.forEach(row => {
        const className = String(row[1] || '').trim().toUpperCase().replace('-', ' ');
        if (className && className.match(/^([IVX]+)\s[A-Z]$/i)) {
          if (!classMap.has(className)) {
            classMap.set(className, { id: 'c-' + className.toLowerCase().replace(/\s+/g, '-'), name: className });
          }
        }
      });
    }

    // Fallback classes if none found
    if (classMap.size === 0) {
      console.log('[ServerParser] No classes in Master, using fallback II-V');
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

    const gradeOrder = ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    const officialClasses = Array.from(classMap.values()).map((c: any) => c.name);
    officialClasses.sort((a: string, b: string) => {
      const [gA, sA] = a.split(' ');
      const [gB, sB] = b.split(' ');
      if (gradeOrder.indexOf(gA) !== gradeOrder.indexOf(gB)) return gradeOrder.indexOf(gA) - gradeOrder.indexOf(gB);
      return sA.localeCompare(sB);
    });

    // ── Class Range Expander ──
    const expandClassRanges = (input: string): string[] => {
      if (!input) return [];
      let str = input.toUpperCase().replace(/\s+/g, ' ').trim();
      if (str === 'SPECIAL TEACHER' || str === 'SPECIAL') return [];

      str = str.replace(/\s+AND\s+/g, ',').replace(/\s*&\s*/g, ',');
      const parts = str.split(/[,，;]/).map(s => s.trim());
      const result = new Set<string>();

      for (let part of parts) {
        if (!part) continue;
        if (part === 'II-V' || part === 'II - V') {
          officialClasses.filter((c: string) => c.match(/^(II|III|IV|V)\s/)).forEach((c: string) => result.add(c));
          continue;
        }
        if (part === 'II' || part === 'III' || part === 'IV' || part === 'V') {
          officialClasses.filter((c: string) => c.startsWith(part + ' ')).forEach((c: string) => result.add(c));
          continue;
        }

        part = part.replace(/^([IVX]+)([^IVX\s])/, '$1 $2');

        if (part.includes(' TO ') || part.includes('-')) {
          const ends = part.includes(' TO ') ? part.split(' TO ') : part.split('-');
          let startStr = ends[0].trim().replace(/^([IVX]+)([^IVX\s])/, '$1 $2');
          let endStr = ends[1].trim().replace(/^([IVX]+)([^IVX\s])/, '$1 $2');

          let startIndex = officialClasses.indexOf(startStr);
          if (startIndex === -1 && !startStr.includes(' ')) {
            startIndex = officialClasses.findIndex((c: string) => c.startsWith(startStr + ' '));
          }
          let endIndex = officialClasses.indexOf(endStr);
          if (endIndex === -1 && !endStr.includes(' ')) {
            const matches = officialClasses.filter((c: string) => c.startsWith(endStr + ' '));
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

    // ── 2. Teachers – dynamic sheet detection ──
    let teacherSheetsToProcess: string[] = [];

    // Try explicit name matches first
    const explicitSheet = sheetNames.find(s => {
      const up = s.toUpperCase();
      return up.includes('SYNOPSIS') || (up.includes('TEACHER') && up.includes('MASTER')) || up.includes('CLASS II-V');
    });
    if (explicitSheet) {
      teacherSheetsToProcess.push(explicitSheet);
    } else {
      // Dynamic scan: find sheets with teacher/subject/class column headers
      for (const sn of sheetNames) {
        const up = sn.toUpperCase();
        if (up.includes('TIMING') || up.includes('BELL') || sn === classesSheetName) continue;
        const sRows = xlsx.utils.sheet_to_json(workbook.Sheets[sn], { header: 1, defval: '' }) as any[][];
        for (let i = 0; i < Math.min(sRows.length, 15); i++) {
          const rowStr = sRows[i].map((c: any) => String(c).toUpperCase().trim()).join('|');
          const hasTeacher = rowStr.includes('TEACHER') || rowStr.includes('NAME') || rowStr.includes('INSTRUCTOR');
          const hasSubject = rowStr.includes('SUBJECT') || rowStr.includes('COURSE');
          const hasClass = rowStr.includes('CLASS') || rowStr.includes('SECTION') || rowStr.includes('GRADE');
          if ((hasTeacher && hasSubject) || (hasTeacher && hasClass) || (hasSubject && hasClass)) {
            teacherSheetsToProcess.push(sn);
            break;
          }
        }
      }
      // Ultimate fallback: first non-excluded sheet
      if (teacherSheetsToProcess.length === 0) {
        const fb = sheetNames.find(s => {
          const up = s.toUpperCase();
          return !up.includes('TIMING') && !up.includes('BELL') && s !== classesSheetName;
        });
        if (fb) teacherSheetsToProcess.push(fb);
      }
    }

    for (const teacherSheetName of teacherSheetsToProcess) {
      console.log(`[ServerParser] Using teacher sheet: ${teacherSheetName}`);
      const teacherSheet = workbook.Sheets[teacherSheetName];
      const rows = xlsx.utils.sheet_to_json(teacherSheet, { header: 1, defval: '' }) as any[][];

      let colIndices = { subject: -1, teacher: -1, classes: -1, total: -1 };
      let inDataBlock = false;
      const commonSubjects = ['ENGLISH', 'MATHS', 'SCIENCE', 'HINDI', 'READING', 'COMPUTER', 'DRAWING', 'LIBRARY', 'GAMES', 'DANCE', 'MUSIC', 'ROBOTICS', 'SST', 'G.K.', 'HOBBY', 'ZUMBA'];

      rows.forEach((rowRaw, rowIndex) => {
        const row = rowRaw.map((c: any) => String(c).toUpperCase().trim());
        const rowStr = row.join('|');

        // Check if this row is a header
        if (rowStr.includes('SUBJECT') && (rowStr.includes('TEACHER') || rowStr.includes('NAME'))) {
          colIndices = { subject: -1, teacher: -1, classes: -1, total: -1 };
          row.forEach((c: string, idx: number) => {
            if (c === 'SUBJECT') colIndices.subject = idx;
            else if (c.includes('SUBJECT') && colIndices.subject === -1) colIndices.subject = idx;
            
            if (c.includes('TEACHER') && c.includes('NAME')) colIndices.teacher = idx;
            else if (c.includes('TEACHER') && colIndices.teacher === -1) colIndices.teacher = idx;
            else if (c === 'NAME' && colIndices.teacher === -1) colIndices.teacher = idx;
            
            if (c.includes('CLASS') || c.includes('SECTION')) colIndices.classes = idx;
            if (c.includes('TOTAL') || c.includes('PERIOD')) colIndices.total = idx;
          });
          if (colIndices.subject === -1) colIndices.subject = row.findIndex((c: string) => c.includes('SUBJECT'));
          if (colIndices.teacher === -1) colIndices.teacher = row.findIndex((c: string) => c.includes('NAME') || c.includes('TEACHER'));
          inDataBlock = true;
          return;
        }

        if (!inDataBlock) return;
        if (colIndices.teacher === -1 || colIndices.subject === -1 || colIndices.classes === -1) return;

        let teacherName = String(rowRaw[colIndices.teacher] || '').trim().toUpperCase();
        let subjectsStr = String(rowRaw[colIndices.subject] || '').trim().toUpperCase();
        const classesStr = String(rowRaw[colIndices.classes] || '').trim();
        const total = parseInt(String(rowRaw[colIndices.total] || '0')) || 0;

        if (!teacherName || teacherName === 'TEACHERS NAME' || teacherName === 'SUBJECT' || teacherName === 'NAME') return;
        if (teacherName.includes('S.NO') || teacherName === 'S.NO.') return;
        if (subjectsStr === 'SUBJECT') return;

        if (commonSubjects.includes(teacherName)) {
          const otherVal = String(rowRaw[colIndices.subject] || '').trim().toUpperCase();
          if (otherVal.includes('MS.') || otherVal.includes('MR.') || otherVal.includes('MRS.')) {
            [teacherName, subjectsStr] = [otherVal, teacherName];
          } else {
            return;
          }
        }

        if (!teacherName || !subjectsStr) return;

        const tId = 't-' + teacherName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '');
        const subjects = subjectsStr.split(/[,/&]/).map(s => s.trim().toUpperCase()).filter(Boolean);

        if (!teacherMap.has(tId)) {
          teacherMap.set(tId, { id: tId, name: teacherName, maxHoursPerWeek: total || 30, subjects: [...subjects] });
        } else {
          const t = teacherMap.get(tId)!;
          subjects.forEach(s => { if (!t.subjects.includes(s)) t.subjects.push(s); });
          if (total > 0) t.maxHoursPerWeek = Math.max(t.maxHoursPerWeek, total);
        }

        const foundClasses = expandClassRanges(classesStr);
        if (foundClasses.length > 0) {
          subjects.forEach(subName => {
            const subId = 'sub-' + subName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
            if (!subjectMap.has(subName)) {
              subjectMap.set(subName, { id: subId, name: subName, color: getSubjectColor(subName), isAllenBlock: false });
            }
            const periodsPerSection = Math.round(total / (foundClasses.length * subjects.length)) || 6;
            foundClasses.forEach(cName => {
              const classId = 'c-' + cName.toLowerCase().replace(/\s+/g, '-');
              finalData.assignments.push({
                id: `asgn-${tId}-${subId}-${classId}`,
                classId, subjectId: subId, teacherId: tId, periodsPerWeek: periodsPerSection
              });
            });
          });
        }
      });
    }

    if (teacherSheetsToProcess.length === 0) {
      console.log('[ServerParser] No teacher sheet found!');
    }

    // ── 2.5 Auto-Inject Missing Activities (Slot List Rules) ──
    const slotRules = [
      { sub: 'HOBBY', periods: (c: string) => 3 }, // Includes Dance/Music/Theatre
      { sub: 'GAMES', periods: (c: string) => c === 'II' ? 2 : 1 },
      { sub: 'LIBRARY', periods: (c: string) => 1 },
      { sub: 'DRAWING', periods: (c: string) => ['II', 'III', 'IV', 'V'].includes(c) ? 1 : 0 },
      { sub: 'ROBOTICS', periods: (c: string) => ['II', 'III', 'IV', 'V'].includes(c) ? 1 : 0 },
    ];

    const genericTeachers = new Map<string, string>(); // subName -> teacherId

    Array.from(classMap.values()).forEach(cls => {
      const grade = cls.name.split(' ')[0];
      if (!['II', 'III', 'IV', 'V'].includes(grade)) return;

      slotRules.forEach(rule => {
        const requiredPeriods = rule.periods(grade);
        if (requiredPeriods > 0) {
          const subId = 'sub-' + rule.sub.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
          
          // Ensure subject exists
          if (!subjectMap.has(rule.sub)) {
            subjectMap.set(rule.sub, { id: subId, name: rule.sub, color: getSubjectColor(rule.sub), isAllenBlock: false });
          }

          // Check if class already has this assignment
          const hasAssignment = finalData.assignments.some(a => a.classId === cls.id && a.subjectId === subId);
          
          if (!hasAssignment) {
            let genericTId = genericTeachers.get(rule.sub);
            if (!genericTId) {
              const teacherName = `[Generic] ${rule.sub} Teacher`;
              genericTId = 't-generic-' + rule.sub.toLowerCase();
              genericTeachers.set(rule.sub, genericTId);
              teacherMap.set(genericTId, {
                id: genericTId,
                name: teacherName,
                maxHoursPerWeek: 40,
                subjects: [rule.sub]
              });
            }

            finalData.assignments.push({
              id: `asgn-${genericTId}-${subId}-${cls.id}-auto`,
              classId: cls.id,
              subjectId: subId,
              teacherId: genericTId,
              periodsPerWeek: requiredPeriods
            });
          }
        }
      });
    });

    // ── 3. Finalize ──
    const allowedGrades = ['II', 'III', 'IV', 'V'];
    
    finalData.teachers = Array.from(teacherMap.values());
    
    // Filter classes to only Grade II-V
    finalData.classes = Array.from(classMap.values())
      .filter((c: any) => {
        const grade = c.name.split(' ')[0];
        return allowedGrades.includes(grade);
      })
      .sort((a: any, b: any) => {
        const [gA, sA] = a.name.split(' ');
        const [gB, sB] = b.name.split(' ');
        if (gradeOrder.indexOf(gA) !== gradeOrder.indexOf(gB)) return gradeOrder.indexOf(gA) - gradeOrder.indexOf(gB);
        return sA.localeCompare(sB);
      });

    // Filter assignments to only those belonging to the filtered classes
    const classIds = new Set(finalData.classes.map(c => c.id));
    finalData.assignments = finalData.assignments.filter(a => classIds.has(a.classId));
    
    finalData.subjects = Array.from(subjectMap.values());

    console.log(`[ServerParser] Result: ${finalData.teachers.length} teachers, ${finalData.classes.length} classes, ${finalData.subjects.length} subjects, ${finalData.assignments.length} assignments`);

    // Save to data store
    updateDataStore(finalData);

    return NextResponse.json({ success: true, data: finalData });
  } catch (error: any) {
    console.error('[ServerSync] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Sync failed' }, { status: 500 });
  }
}
