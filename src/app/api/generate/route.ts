import { NextResponse } from 'next/server';
import { getDataStore, updateDataStore, TimetableEntry, Assignment } from '@/data/mockData';

/**
 * Timetable Generator using a Greedy Scheduling Algorithm.
 */
function generateTimetableGreedy(data: ReturnType<typeof getDataStore>): TimetableEntry[] {
  const { teachers, classes, assignments, days, bellSchedule, subjects } = data;

  // ── HARDCODED HOBBY DAY RULES (Grade → allowed days) ──────────────
  const hobbyDayRules: Record<string, string[]> = {
    'II': ['Monday', 'Wednesday', 'Friday'],
    'V': ['Monday', 'Wednesday', 'Friday'],
    'III': ['Tuesday', 'Thursday', 'Saturday'],
    'IV': ['Tuesday', 'Thursday', 'Saturday'],
  };

  const getClassGrade = (classId: string): string => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return '';
    return cls.name.split(' ')[0]; // "III A" → "III"
  };

  const isHobbyDay = (classId: string, day: string): boolean => {
    const grade = getClassGrade(classId);
    const allowed = hobbyDayRules[grade];
    if (!allowed) return true; // If grade not in rules, allow any day
    return allowed.includes(day);
  };

  const classPeriods = bellSchedule.filter(p => p.type === 'Class');

  // ── Build the schedule grid ─────────────────────────────────────────
  const classOccupied = new Map<string, string>();
  const teacherOccupied = new Map<string, string>();
  const entries: TimetableEntry[] = [];
  const slotKey = (id: string, day: string, pId: string) => `${id}|${day}|${pId}`;

  // ── Subject helpers ─────────────────────────────────────────────────
  const getSubName = (subId: string) => subjects.find(s => s.id === subId)?.name?.toUpperCase() || '';
  const isMathSci = (subId: string) => {
    const n = getSubName(subId);
    return n.includes('MATH') || n.includes('SCI');
  };
  const isGames = (subId: string) => getSubName(subId) === 'GAMES';
  const isHobby = (subId: string) => getSubName(subId) === 'HOBBY';
  const isZumba = (subId: string) => getSubName(subId).includes('ZUMBA');

  const isStrictActivity = (subId: string) => {
    const name = getSubName(subId);
    return name === 'HOBBY' || name === 'GAMES' || name.includes('DANCE') ||
      name.includes('MUSIC') || name.includes('THEATRE') || name.includes('SPORTS') ||
      name.includes('CLUB');
  };

  const isAnyActivity = (subId: string) => {
    const n = getSubName(subId).toUpperCase();
    return isStrictActivity(subId) || n.includes('ROBOTICS') || n.includes('DRAWING') ||
      n.includes('LIBRARY') || n.includes('ZUMBA') || n.includes('ART');
  };

  const lunchIdx = bellSchedule.findIndex(p => p.type === 'Lunch');
  const periodAfterLunchId = lunchIdx >= 0 && lunchIdx + 1 < bellSchedule.length
    ? bellSchedule[lunchIdx + 1].id
    : null;
  const lastPeriodId = classPeriods[classPeriods.length - 1]?.id;

  const classDayCategories = new Map<string, Set<string>>();
  const classSubjectDayCount = new Map<string, number>();
  const lastSubjectInSlot = new Map<string, string>();

  function getActivityCountForClassDay(classId: string, day: string): number {
    return entries.filter(e => e.classId === classId && e.day === day && isStrictActivity(e.subjectId)).length;
  }

  // ── Check if a placement is valid ───────────────────────────────────
  function canPlace(asgn: Assignment, day: string, periodId: string, periodIndex: number): boolean {
    if (classOccupied.has(slotKey(asgn.classId, day, periodId))) return false;
    if (teacherOccupied.has(slotKey(asgn.teacherId, day, periodId))) return false;

    const csdKey = `${asgn.classId}|${day}|${asgn.subjectId}`;
    if ((classSubjectDayCount.get(csdKey) || 0) >= 2) return false;

    const isActivity = isStrictActivity(asgn.subjectId);
    if (isActivity) {
      if (!isHobbyDay(asgn.classId, day)) return false;
      if (getActivityCountForClassDay(asgn.classId, day) >= 2) return false;
    }

    if (!isActivity) {
      if (periodIndex > 0) {
        const prevKey = `${asgn.classId}|${day}|${periodIndex - 1}`;
        if (lastSubjectInSlot.get(prevKey) === asgn.subjectId) return false;
      }
    }

    if (periodId === lastPeriodId && isMathSci(asgn.subjectId)) return false;
    if (periodId === periodAfterLunchId && isGames(asgn.subjectId)) return false;

    const periodNum = parseInt(periodId.replace(/[^0-9]/g, ''));
    if ((periodNum === 8 || periodNum === 10) && isZumba(asgn.subjectId)) return false;

    if (isZumba(asgn.subjectId)) {
      let zumbaCount = 0;
      for (const e of entries) {
        if (e.day === day && e.periodId === periodId && isZumba(e.subjectId)) zumbaCount++;
      }
      if (zumbaCount >= 2) return false;
    }

    // 9. Rule 5: STRICT - Games and Hobby cannot be on the same day
    const cdKey = `${asgn.classId}|${day}`;
    const dayCategories = classDayCategories.get(cdKey) || new Set();
    if (isGames(asgn.subjectId) && dayCategories.has('hobby')) return false;
    if (isHobby(asgn.subjectId) && dayCategories.has('games')) return false;

    return true;
  }

  // ── Place an assignment ─────────────────────────────────────────────
  function placeAssignment(asgn: Assignment, day: string, periodId: string, periodIndex: number) {
    classOccupied.set(slotKey(asgn.classId, day, periodId), asgn.id);
    teacherOccupied.set(slotKey(asgn.teacherId, day, periodId), asgn.id);

    const csdKey = `${asgn.classId}|${day}|${asgn.subjectId}`;
    classSubjectDayCount.set(csdKey, (classSubjectDayCount.get(csdKey) || 0) + 1);
    lastSubjectInSlot.set(`${asgn.classId}|${day}|${periodIndex}`, asgn.subjectId);

    const cdKey = `${asgn.classId}|${day}`;
    if (!classDayCategories.has(cdKey)) classDayCategories.set(cdKey, new Set());
    const cats = classDayCategories.get(cdKey)!;
    if (isGames(asgn.subjectId)) cats.add('games');
    if (isHobby(asgn.subjectId)) cats.add('hobby');

    entries.push({
      id: `gen-${entries.length}-${asgn.id.substring(0, 8)}`,
      day, periodId,
      classId: asgn.classId,
      subjectId: asgn.subjectId,
      teacherId: asgn.teacherId,
    });

    // ── BLOCK SCHEDULING: Force consecutive periods for activities ──
    if (isStrictActivity(asgn.subjectId)) {
      const nextIdx = periodIndex + 1;
      if (nextIdx < classPeriods.length) {
        const nextP = classPeriods[nextIdx];
        const currentlyPlaced = entries.filter(e => e.classId === asgn.classId && e.subjectId === asgn.subjectId).length;
        if (currentlyPlaced < asgn.periodsPerWeek) {
          if (canPlace(asgn, day, nextP.id, nextIdx)) {
            placeAssignment(asgn, day, nextP.id, nextIdx);
          }
        }
      }
    }
  }

  const teacherLoad = new Map<string, number>();
  assignments.forEach(a => {
    teacherLoad.set(a.teacherId, (teacherLoad.get(a.teacherId) || 0) + a.periodsPerWeek);
  });

  const sortedAssignments = [...assignments]
    .filter(a => a.periodsPerWeek > 0)
    .sort((a, b) => {
      const aAct = isStrictActivity(a.subjectId) ? 0 : 1;
      const bAct = isStrictActivity(b.subjectId) ? 0 : 1;
      if (aAct !== bAct) return aAct - bAct;
      const loadDiff = (teacherLoad.get(b.teacherId) || 0) - (teacherLoad.get(a.teacherId) || 0);
      if (loadDiff !== 0) return loadDiff;
      return b.periodsPerWeek - a.periodsPerWeek;
    });

  for (const asgn of sortedAssignments) {
    let placed = entries.filter(e => e.classId === asgn.classId && e.subjectId === asgn.subjectId).length;
    if (placed >= asgn.periodsPerWeek) continue;

    const dayOrder = [...days].sort(() => Math.random() - 0.5);

    for (const day of dayOrder) {
      if (placed >= asgn.periodsPerWeek) break;
      const periodIndices = Array.from({ length: classPeriods.length }, (_, i) => i).sort(() => Math.random() - 0.5);
      for (const pi of periodIndices) {
        if (placed >= asgn.periodsPerWeek) break;
        const period = classPeriods[pi];
        if (canPlace(asgn, day, period.id, pi)) {
          placeAssignment(asgn, day, period.id, pi);
          placed = entries.filter(e => e.classId === asgn.classId && e.subjectId === asgn.subjectId).length;
        }
      }
    }
  }

  // GAP-FILL
  for (const cls of classes) {
    const classAssignments = sortedAssignments.filter(a => a.classId === cls.id);
    for (const day of days) {
      for (let pi = 0; pi < classPeriods.length; pi++) {
        const period = classPeriods[pi];
        if (classOccupied.has(slotKey(cls.id, day, period.id))) continue;
        const candidates = classAssignments
          .filter(a => !isAnyActivity(a.subjectId))
          .map(a => ({
            ...a,
            placedCount: entries.filter(e => e.classId === cls.id && e.subjectId === a.subjectId).length,
          }))
          .sort((a, b) => a.placedCount - b.placedCount);

        for (const candidate of candidates) {
          if (canPlace(candidate, day, period.id, pi)) {
            placeAssignment(candidate, day, period.id, pi);
            break;
          }
        }
      }
    }
  }

  return entries;
}

export async function POST() {
  try {
    const data = getDataStore();
    const classPeriods = data.bellSchedule.filter(p => p.type === 'Class');

    if (!data.assignments || data.assignments.length === 0) {
      return NextResponse.json({ success: false, message: 'No curriculum mappings found.' });
    }
    if (classPeriods.length === 0) {
      return NextResponse.json({ success: false, message: 'No teaching periods found.' });
    }

    const newTimetable = generateTimetableGreedy(data);
    updateDataStore({ ...data, timetable: newTimetable });

    return NextResponse.json({
      success: true,
      message: `✅ Generated ${newTimetable.length} scheduled periods.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: `Error: ${error.message}` });
  }
}
