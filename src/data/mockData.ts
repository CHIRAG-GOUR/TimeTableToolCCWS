
export interface Teacher { id: string; name: string; maxHoursPerWeek: number; subjects: string[]; }
export interface Subject { id: string; name: string; color: string; isAllenBlock: boolean; }
export interface ClassSection { id: string; name: string; classTeacherId?: string; }
export interface Period { id: string; name: string; startTime: string; endTime: string; type: 'Class' | 'Break' | 'Lunch' | 'FruitBreak'; }
export interface Assignment { id: string; classId: string; subjectId: string; teacherId: string; periodsPerWeek: number; }
export interface TimetableEntry { id: string; day: string; periodId: string; classId: string; subjectId: string; teacherId: string; }

export interface HobbyDay { periodId: string; day: string; classRange: string; }
export interface SubjectRatio { classId: string; subjectId: string; periodsPerWeek: number; }
export interface HardConstraint { id: string; rule: string; type: 'Global' | 'Teacher' | 'Venue'; }

export interface MockData {
  teachers: Teacher[];
  subjects: Subject[];
  classes: ClassSection[];
  bellSchedule: Period[];
  assignments: Assignment[];
  timetable: TimetableEntry[];
  days: string[];
  hobbyDays: HobbyDay[];
  subjectRatios: SubjectRatio[];
  hardConstraints: HardConstraint[];
}

export const initialMockData: MockData = {
  teachers: [],
  subjects: [],
  classes: [],
  bellSchedule: [],
  assignments: [],
  timetable: [],
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  hobbyDays: [],
  subjectRatios: [],
  hardConstraints: [
    { id: 'hc-1', rule: '1. In a day max to max only 5P', type: 'Global' },
    { id: 'hc-2', rule: '2. Periods can be in combination of 3+2 with gap of 2 to 3 period in between', type: 'Global' },
    { id: 'hc-3', rule: '3. Avoid to have last period Maths and Science', type: 'Global' },
    { id: 'hc-4', rule: '4. Everyday 1 period non Academic', type: 'Global' },
    { id: 'hc-5', rule: '5. Games and Hobby should not be on same day', type: 'Global' },
    { id: 'hc-6', rule: '6. Dance / Music / Hobby Period should not be on same day', type: 'Global' },
    { id: 'hc-7', rule: '7. Two same subject should not be consequtive', type: 'Global' },
    { id: 'hc-8', rule: '8. More then 2 period of same subject can not be on same day', type: 'Global' },
    { id: 'hc-9', rule: '9. Just after lunch games should not be given', type: 'Global' },
    { id: 'hc-10', rule: '10. At a time 2 Zumba period Should not be given', type: 'Global' },
    { id: 'hc-11', rule: '11. Zumba period should not be given in 8p and 10 p', type: 'Global' },
    { id: 'hc-12', rule: '12. II -VII classes should be alloted in between 3P to 10 Period', type: 'Global' },
    { id: 'hc-13', rule: '13. Hobby classes should be allotted as per mentioned days and timings only', type: 'Global' },
    { id: 'hc-14', rule: '14. Assembly and Club Classes should be added as per the mentioned slot', type: 'Global' }
  ],
};

const globalForData = global as unknown as { _dataStore?: MockData };

if (!globalForData._dataStore) {
  globalForData._dataStore = JSON.parse(JSON.stringify(initialMockData));
}

export function getDataStore(): MockData {
  return globalForData._dataStore!;
}

export function updateDataStore(newData: MockData) {
  globalForData._dataStore = newData;
}
