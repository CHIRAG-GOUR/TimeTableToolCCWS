const fs = require('fs');
const path = require('path');

async function main() {
  const filePath = path.join(__dirname, 'school_data_parsed.json');
  if (!fs.existsSync(filePath)) {
    console.error('Parsed JSON not found.');
    return;
  }

  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const teacherNames = new Set();
  const classNames = new Set();
  const seenPeriods = new Set();
  const bellSchedule = [];

  // Iterate through all sheets and all rows
  Object.keys(rawData).forEach(sheetName => {
    const rows = rawData[sheetName];
    rows.forEach(row => {
      Object.values(row).forEach((cell, colIndex) => {
        const val = String(cell).trim();
        if (!val) return;

        // Detect Teachers
        if (val.match(/^(MS\.|MR\.|MRS\.)\s+[A-Z]/i)) {
          const cleanName = val.replace(/\s+/g, ' ').trim();
          if (cleanName.length > 5) teacherNames.add(cleanName.toUpperCase());
        }

        // Detect Classes
        const classMatch = val.match(/^([IVXLC0-9]+[ -][A-Z])$/i);
        if (classMatch && val.length < 10) {
          classNames.add(val.toUpperCase());
        }

        // Detect Periods (from rows)
        if (val.match(/^(\d+P|LUNCH|BREAK|FRUIT|0P|MIND|ASSEMBLY|WE TIME)/i)) {
          // In the JSON, the timing might be in a field like "__EMPTY_2" or just next in the row object keys
          // But Object.values doesn't guarantee order. Let's try to find it in the same row object.
          const rowValues = Object.values(row);
          const idx = rowValues.indexOf(cell);
          const nextCell = String(rowValues[idx + 1] || '').trim();
          
          const timeMatch = nextCell.match(/(\d{1,2}[:.]\d{2})\s*-\s*(\d{1,2}[:.]\d{2})/);
          if (timeMatch) {
            const id = val.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '').replace(/[^a-z0-9-]/g, '');
            if (!seenPeriods.has(id)) {
              let type = 'Class';
              if (id.includes('lunch')) type = 'Lunch';
              if (id.includes('break') || id.includes('mind') || id.includes('assembly')) type = 'Break';
              if (id.includes('fruit')) type = 'FruitBreak';

              bellSchedule.push({
                id,
                name: val.replace(/\n/g, ' '),
                startTime: timeMatch[1].replace('.', ':'),
                endTime: timeMatch[2].replace('.', ':'),
                type
              });
              seenPeriods.add(id);
            }
          }
        }
      });
    });
  });

  // Finalize Teachers
  const teachers = Array.from(teacherNames).map(name => ({
    id: 't-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, ''),
    name: name,
    maxHoursPerWeek: 36,
    subjects: []
  }));

  // Finalize Classes
  const classes = Array.from(classNames).sort().map((name, idx) => ({
    id: `c-${idx + 1}`,
    name: name
  }));

  // Fallback for Bell Schedule if none found
  if (bellSchedule.length === 0) {
    bellSchedule.push(
      { id: 'p0', name: '0P (Mindfulness)', startTime: '08:00', endTime: '08:15', type: 'Break' },
      { id: 'p1', name: '1P', startTime: '08:15', endTime: '09:00', type: 'Class' },
      { id: 'p2', name: '2P', startTime: '09:00', endTime: '09:50', type: 'Class' },
      { id: 'p3', name: '3P', startTime: '09:50', endTime: '10:30', type: 'Class' },
      { id: 'p4', name: '4P', startTime: '10:30', endTime: '11:20', type: 'Class' },
      { id: 'lunch', name: 'LUNCH', startTime: '11:20', endTime: '11:40', type: 'Lunch' },
      { id: 'p5', name: '5P', startTime: '11:40', endTime: '12:25', type: 'Class' },
      { id: 'p6', name: '6P', startTime: '12:25', endTime: '01:10', type: 'Class' },
      { id: 'p7', name: '7P', startTime: '01:10', endTime: '02:00', type: 'Class' },
      { id: 'fruit', name: 'FRUIT LUNCH', startTime: '02:00', endTime: '02:10', type: 'FruitBreak' },
      { id: 'p8', name: '8P', startTime: '02:10', endTime: '02:50', type: 'Class' },
      { id: 'p9', name: '9P', startTime: '02:50', endTime: '03:40', type: 'Class' },
      { id: 'p10', name: '10P', startTime: '03:40', endTime: '04:30', type: 'Class' }
    );
  } else {
    bellSchedule.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  const subjects = [
    { id: 'sub-eng', name: 'English', color: '#6366f1', isAllenBlock: false },
    { id: 'sub-math', name: 'Mathematics', color: '#ec4899', isAllenBlock: false },
    { id: 'sub-hin', name: 'Hindi', color: '#ef4444', isAllenBlock: false },
    { id: 'sub-sci', name: 'Science', color: '#14b8a6', isAllenBlock: false },
    { id: 'sub-sst', name: 'SST', color: '#f97316', isAllenBlock: false },
    { id: 'sub-comp', name: 'Computer', color: '#0ea5e9', isAllenBlock: false },
    { id: 'sub-games', name: 'Games', color: '#22c55e', isAllenBlock: true },
    { id: 'sub-skill', name: 'Skillizee', color: '#a855f7', isAllenBlock: true }
  ];

  const assignments = [];
  let assignmentId = 1;
  classes.forEach(c => {
    const t1 = teachers[Math.floor(Math.random() * teachers.length)];
    const t2 = teachers[Math.floor(Math.random() * teachers.length)];
    if (t1 && t2) {
      assignments.push({ id: `a-${assignmentId++}`, classId: c.id, subjectId: 'sub-math', teacherId: t1.id, periodsPerWeek: 6 });
      assignments.push({ id: `a-${assignmentId++}`, classId: c.id, subjectId: 'sub-eng', teacherId: t2.id, periodsPerWeek: 6 });
    }
  });

  const content = `
export interface Teacher { id: string; name: string; maxHoursPerWeek: number; subjects: string[]; }
export interface Subject { id: string; name: string; color: string; isAllenBlock: boolean; }
export interface ClassSection { id: string; name: string; classTeacherId?: string; }
export interface Period { id: string; name: string; startTime: string; endTime: string; type: 'Class' | 'Break' | 'Lunch' | 'FruitBreak'; }
export interface Assignment { id: string; classId: string; subjectId: string; teacherId: string; periodsPerWeek: number; }
export interface TimetableEntry { id: string; day: string; periodId: string; classId: string; subjectId: string; teacherId: string; }

export interface MockData {
  teachers: Teacher[];
  subjects: Subject[];
  classes: ClassSection[];
  bellSchedule: Period[];
  assignments: Assignment[];
  timetable: TimetableEntry[];
  days: string[];
}

const teachers: Teacher[] = ${JSON.stringify(teachers, null, 2)};
const subjects: Subject[] = ${JSON.stringify(subjects, null, 2)};
const classes: ClassSection[] = ${JSON.stringify(classes, null, 2)};
const bellSchedule: Period[] = ${JSON.stringify(bellSchedule, null, 2)};
const assignments: Assignment[] = ${JSON.stringify(assignments, null, 2)};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const initialMockData: MockData = {
  teachers,
  subjects,
  classes,
  bellSchedule,
  assignments,
  timetable: [],
  days: DAYS,
};

let dataStore: MockData = JSON.parse(JSON.stringify(initialMockData));

export function getDataStore(): MockData {
  return dataStore;
}

export function updateDataStore(newData: MockData) {
  dataStore = newData;
}
`;

  fs.writeFileSync(path.join(__dirname, 'src/data/mockData.ts'), content);
  console.log(`Updated mockData.ts: ${teachers.length} teachers, ${classes.length} classes, ${bellSchedule.length} periods.`);
}

main();
