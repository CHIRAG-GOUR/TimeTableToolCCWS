export interface Teacher {
  id: string;
  name: string;
  maxHoursPerWeek: number;
  subjects: string[];
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  isAllenBlock: boolean;
}

export interface ClassSection {
  id: string;
  name: string;
  classTeacherId?: string;
}

export interface Period {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  type: 'Class' | 'Break' | 'Lunch' | 'FruitBreak';
}

export interface Assignment {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  periodsPerWeek: number;
}

export interface TimetableEntry {
  id: string;
  day: string;
  periodId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
}

export interface MockData {
  teachers: Teacher[];
  subjects: Subject[];
  classes: ClassSection[];
  bellSchedule: Period[];
  assignments: Assignment[];
  timetable: TimetableEntry[];
  days: string[];
}

// ─── TEACHERS ───────────────────────────────────────────
const teachers: Teacher[] = [
  { id: 't-shalini',   name: 'MS. SHALINI SINGH',          maxHoursPerWeek: 36, subjects: ['sub-eng'] },
  { id: 't-bhawna',    name: 'MS. BHAWNA SHARMA',          maxHoursPerWeek: 36, subjects: ['sub-math'] },
  { id: 't-leela',     name: 'MS. LEELA TAILOR',           maxHoursPerWeek: 36, subjects: ['sub-hin'] },
  { id: 't-nimmy',     name: 'MS. NIMMY NANCY',            maxHoursPerWeek: 20, subjects: ['sub-reading'] },
  { id: 't-yogita',    name: 'MS. YOGITA PAREEK',          maxHoursPerWeek: 36, subjects: ['sub-hin'] },
  { id: 't-kajal',     name: 'MS. KAJAL SEJWANI',          maxHoursPerWeek: 36, subjects: ['sub-math'] },
  { id: 't-jyotsana',  name: 'MS. JYOTSANA SHARMA',       maxHoursPerWeek: 36, subjects: ['sub-sci'] },
  { id: 't-harshita',  name: 'MS. HARSHITA GALANI',       maxHoursPerWeek: 36, subjects: ['sub-sst'] },
  { id: 't-sarita',    name: 'MS. SARITA ACHARYA',        maxHoursPerWeek: 36, subjects: ['sub-eng'] },
  { id: 't-rekha',     name: 'MS. REKHA SHARMA',          maxHoursPerWeek: 36, subjects: ['sub-hin'] },
  { id: 't-somita',    name: 'MS. SOMITA MATHUR',         maxHoursPerWeek: 36, subjects: ['sub-eng'] },
  { id: 't-anjanee',   name: 'MR. ANJANEE KUMAR SHARMA',  maxHoursPerWeek: 40, subjects: ['sub-math'] },
  { id: 't-ujala',     name: 'MS. UJALA TIWARI',          maxHoursPerWeek: 36, subjects: ['sub-bio'] },
  { id: 't-games',     name: 'MR. GAMES INSTRUCTOR',     maxHoursPerWeek: 40, subjects: ['sub-games'] },
  { id: 't-art',       name: 'MS. ANITA (ART)',          maxHoursPerWeek: 30, subjects: ['sub-art'] },
  { id: 't-comp',      name: 'MR. VIKRAM (COMP)',        maxHoursPerWeek: 30, subjects: ['sub-comp'] },
  { id: 't-lib',       name: 'MS. SUDHA (LIB)',          maxHoursPerWeek: 20, subjects: ['sub-lib'] },
  { id: 't-skill',     name: 'SKILLIZEE FACULTY',        maxHoursPerWeek: 40, subjects: ['sub-skill'] },
];

// ─── SUBJECTS ───────────────────────────────────────────
const subjects: Subject[] = [
  { id: 'sub-eng',     name: 'English',       color: '#6366f1', isAllenBlock: false },
  { id: 'sub-math',    name: 'Mathematics',   color: '#ec4899', isAllenBlock: false },
  { id: 'sub-hin',     name: 'Hindi',         color: '#ef4444', isAllenBlock: false },
  { id: 'sub-sci',     name: 'EVS / Science', color: '#14b8a6', isAllenBlock: false },
  { id: 'sub-sst',     name: 'SST / GK',      color: '#f97316', isAllenBlock: false },
  { id: 'sub-comp',    name: 'Computer',      color: '#0ea5e9', isAllenBlock: false },
  { id: 'sub-art',     name: 'Art & Craft',   color: '#f43f5e', isAllenBlock: true },
  { id: 'sub-lib',     name: 'Library',       color: '#64748b', isAllenBlock: true },
  { id: 'sub-games',   name: 'Games',         color: '#22c55e', isAllenBlock: true },
  { id: 'sub-skill',   name: 'Skillizee',     color: '#a855f7', isAllenBlock: true },
];

// ─── CLASSES ────────────────────────────────────────────
const classes: ClassSection[] = [
  { id: 'c-2-a',   name: 'Grade II-A',           classTeacherId: 't-leela' },
  { id: 'c-3-a',   name: 'Grade III-A',          classTeacherId: 't-shalini' },
  { id: 'c-4-a',   name: 'Grade IV-A',           classTeacherId: 't-bhawna' },
  { id: 'c-5-a',   name: 'Grade V-A',            classTeacherId: 't-yogita' },
];

// ─── BELL SCHEDULE (8 PERIODS + FRUIT BREAK + LUNCH) ────
const bellSchedule: Period[] = [
  { id: 'p0',      name: '0P (Mindfulness)', startTime: '07:45', endTime: '08:00', type: 'Break' },
  { id: 'p1',      name: '1P',  startTime: '08:00', endTime: '08:45', type: 'Class' },
  { id: 'p2',      name: '2P',  startTime: '08:45', endTime: '09:30', type: 'Class' },
  { id: 'p-fruit', name: 'Fruit Break', startTime: '09:30', endTime: '09:45', type: 'FruitBreak' },
  { id: 'p3',      name: '3P',  startTime: '09:45', endTime: '10:30', type: 'Class' },
  { id: 'p4',      name: '4P',  startTime: '10:30', endTime: '11:15', type: 'Class' },
  { id: 'p-lunch', name: 'Lunch Break', startTime: '11:15', endTime: '11:45', type: 'Lunch' },
  { id: 'p5',      name: '5P',  startTime: '11:45', endTime: '12:30', type: 'Class' },
  { id: 'p6',      name: '6P',  startTime: '12:30', endTime: '01:15', type: 'Class' },
  { id: 'p7',      name: '7P',  startTime: '01:15', endTime: '02:00', type: 'Class' },
  { id: 'p8',      name: '8P',  startTime: '02:00', endTime: '02:45', type: 'Class' },
];

// ─── ASSIGNMENTS (Curriculum Mapping) ───────────────────
const assignments: Assignment[] = [
  // Grade II-A (48 slots available)
  { id: 'a-2a-1',  classId: 'c-2-a', subjectId: 'sub-math',    teacherId: 't-bhawna',   periodsPerWeek: 8 },
  { id: 'a-2a-2',  classId: 'c-2-a', subjectId: 'sub-eng',     teacherId: 't-shalini',  periodsPerWeek: 8 },
  { id: 'a-2a-3',  classId: 'c-2-a', subjectId: 'sub-hin',     teacherId: 't-leela',    periodsPerWeek: 8 },
  { id: 'a-2a-4',  classId: 'c-2-a', subjectId: 'sub-sci',     teacherId: 't-jyotsana', periodsPerWeek: 6 },
  { id: 'a-2a-5',  classId: 'c-2-a', subjectId: 'sub-comp',    teacherId: 't-comp',     periodsPerWeek: 4 },
  { id: 'a-2a-6',  classId: 'c-2-a', subjectId: 'sub-art',     teacherId: 't-art',      periodsPerWeek: 2 },
  { id: 'a-2a-7',  classId: 'c-2-a', subjectId: 'sub-lib',     teacherId: 't-lib',      periodsPerWeek: 2 },
  { id: 'a-2a-8',  classId: 'c-2-a', subjectId: 'sub-games',   teacherId: 't-games',    periodsPerWeek: 2 },
  { id: 'a-2a-9',  classId: 'c-2-a', subjectId: 'sub-skill',   teacherId: 't-skill',    periodsPerWeek: 8 },
  
  // Grade III-A
  { id: 'a-3a-1',  classId: 'c-3-a', subjectId: 'sub-math',    teacherId: 't-kajal',    periodsPerWeek: 8 },
  { id: 'a-3a-2',  classId: 'c-3-a', subjectId: 'sub-eng',     teacherId: 't-sarita',   periodsPerWeek: 8 },
  { id: 'a-3a-3',  classId: 'c-3-a', subjectId: 'sub-hin',     teacherId: 't-yogita',   periodsPerWeek: 8 },
  { id: 'a-3a-4',  classId: 'c-3-a', subjectId: 'sub-sci',     teacherId: 't-jyotsana', periodsPerWeek: 6 },
  { id: 'a-3a-5',  classId: 'c-3-a', subjectId: 'sub-sst',     teacherId: 't-harshita', periodsPerWeek: 4 },
  { id: 'a-3a-6',  classId: 'c-3-a', subjectId: 'sub-comp',    teacherId: 't-comp',     periodsPerWeek: 2 },
  { id: 'a-3a-7',  classId: 'c-3-a', subjectId: 'sub-games',   teacherId: 't-games',    periodsPerWeek: 2 },
  { id: 'a-3a-8',  classId: 'c-3-a', subjectId: 'sub-skill',   teacherId: 't-skill',    periodsPerWeek: 8 },

  // Grade IV-A
  { id: 'a-4a-1',  classId: 'c-4-a', subjectId: 'sub-math',    teacherId: 't-bhawna',   periodsPerWeek: 8 },
  { id: 'a-4a-2',  classId: 'c-4-a', subjectId: 'sub-eng',     teacherId: 't-somita',   periodsPerWeek: 8 },
  { id: 'a-4a-3',  classId: 'c-4-a', subjectId: 'sub-hin',     teacherId: 't-rekha',    periodsPerWeek: 8 },
  { id: 'a-4a-4',  classId: 'c-4-a', subjectId: 'sub-sst',     teacherId: 't-harshita', periodsPerWeek: 6 },
  { id: 'a-4a-5',  classId: 'c-4-a', subjectId: 'sub-sci',     teacherId: 't-jyotsana', periodsPerWeek: 4 },
  { id: 'a-4a-6',  classId: 'c-4-a', subjectId: 'sub-comp',    teacherId: 't-comp',     periodsPerWeek: 2 },
  { id: 'a-4a-7',  classId: 'c-4-a', subjectId: 'sub-skill',   teacherId: 't-skill',    periodsPerWeek: 4 },

  // Grade V-A
  { id: 'a-5a-1',  classId: 'c-5-a', subjectId: 'sub-math',    teacherId: 't-anjanee',  periodsPerWeek: 8 },
  { id: 'a-5a-2',  classId: 'c-5-a', subjectId: 'sub-eng',     teacherId: 't-sarita',   periodsPerWeek: 8 },
  { id: 'a-5a-3',  classId: 'c-5-a', subjectId: 'sub-hin',     teacherId: 't-yogita',   periodsPerWeek: 8 },
  { id: 'a-5a-4',  classId: 'c-5-a', subjectId: 'sub-sci',     teacherId: 't-ujala',    periodsPerWeek: 6 },
  { id: 'a-5a-5',  classId: 'c-5-a', subjectId: 'sub-sst',     teacherId: 't-harshita', periodsPerWeek: 4 },
  { id: 'a-5a-6',  classId: 'c-5-a', subjectId: 'sub-games',   teacherId: 't-games',    periodsPerWeek: 2 },
  { id: 'a-5a-7',  classId: 'c-5-a', subjectId: 'sub-skill',   teacherId: 't-skill',    periodsPerWeek: 4 },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CLASS_PERIOD_IDS = ['p1','p2','p3','p4','p5','p6','p7','p8'];

// ─── PRE-GENERATED DEMO TIMETABLE ──────────────────────
function generateDemoTimetable(): TimetableEntry[] {
  const entries: TimetableEntry[] = [];
  const classSlotUsed = new Set<string>();
  const teacherSlotUsed = new Set<string>();

  const slotKey = (id: string, day: string, pId: string) => `${id}::${day}::${pId}`;
  
  const shuffle = <T>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const sorted = [...assignments].sort((a, b) => b.periodsPerWeek - a.periodsPerWeek);

  for (const asgn of sorted) {
    let placed = 0;
    const shuffledDays = shuffle(DAYS);
    const shuffledPeriods = shuffle(CLASS_PERIOD_IDS);

    for (const day of shuffledDays) {
      if (placed >= asgn.periodsPerWeek) break;
      for (const pId of shuffledPeriods) {
        if (placed >= asgn.periodsPerWeek) break;
        
        const cKey = slotKey(asgn.classId, day, pId);
        const tKey = slotKey(asgn.teacherId, day, pId);
        
        if (!classSlotUsed.has(cKey) && !teacherSlotUsed.has(tKey)) {
          entries.push({ 
            id: `d-${Math.random().toString(36).substr(2, 9)}`, 
            day, 
            periodId: pId, 
            classId: asgn.classId, 
            subjectId: asgn.subjectId, 
            teacherId: asgn.teacherId 
          });
          classSlotUsed.add(cKey);
          teacherSlotUsed.add(tKey);
          placed++;
        }
      }
    }
  }
  return entries;
}

export const initialMockData: MockData = {
  teachers,
  subjects,
  classes,
  bellSchedule,
  assignments,
  timetable: generateDemoTimetable(),
  days: DAYS,
};

let dataStore: MockData = JSON.parse(JSON.stringify(initialMockData));

export function getDataStore(): MockData {
  return dataStore;
}

export function updateDataStore(newData: MockData) {
  dataStore = newData;
}
