import { NextResponse } from 'next/server';
import { getDataStore, updateDataStore, TimetableEntry, Assignment } from '@/data/mockData';

/**
 * Pure JavaScript Timetable Generator
 * Uses a greedy constraint-satisfaction algorithm:
 *   1. Sort assignments by difficulty (most periods first)
 *   2. For each assignment, distribute across the week
 *   3. Enforce: no teacher double-booking, no class double-booking
 *   4. Limit same-subject per day for variety
 */
function generateTimetable(data: ReturnType<typeof getDataStore>): TimetableEntry[] {
  const { teachers, classes, assignments, days, bellSchedule } = data;
  const classPeriods = bellSchedule.filter(p => p.type === 'Class');
  const periodIds = classPeriods.map(p => p.id);

  const entries: TimetableEntry[] = [];

  // Occupancy trackers
  const classOccupied = new Map<string, boolean>();   // "classId::day::periodId" -> true
  const teacherOccupied = new Map<string, boolean>(); // "teacherId::day::periodId" -> true

  const classKey = (classId: string, day: string, pId: string) => `${classId}::${day}::${pId}`;
  const teacherKey = (teacherId: string, day: string, pId: string) => `${teacherId}::${day}::${pId}`;

  // Helper to shuffle array
  const shuffle = <T>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Sort: hardest to place first (most periods, shared teachers)
  const sorted = [...assignments].sort((a, b) => b.periodsPerWeek - a.periodsPerWeek);

  for (const asgn of sorted) {
    let placed = 0;
    const needed = asgn.periodsPerWeek;

    // Shuffle days and periods to ensure variety across classes
    const shuffledDays = shuffle(days);
    const shuffledPeriods = shuffle(periodIds);

    // Multiple passes with increasing flexibility
    for (let maxPerDay = 1; maxPerDay <= 2 && placed < needed; maxPerDay++) {
      for (const day of shuffledDays) {
        if (placed >= needed) break;

        // Count how many of this subject already placed today
        const todayCount = entries.filter(
          e => e.classId === asgn.classId && e.subjectId === asgn.subjectId && e.day === day
        ).length;
        if (todayCount >= maxPerDay) continue;

        for (const pId of shuffledPeriods) {
          if (placed >= needed) break;

          const cKey = classKey(asgn.classId, day, pId);
          const tKey = teacherKey(asgn.teacherId, day, pId);

          if (classOccupied.has(cKey)) continue;
          if (teacherOccupied.has(tKey)) continue;

          // Re-check today count
          const todayCountNow = entries.filter(
            e => e.classId === asgn.classId && e.subjectId === asgn.subjectId && e.day === day
          ).length;
          if (todayCountNow >= maxPerDay) break;

          entries.push({
            id: `gen-${Math.random().toString(36).substr(2, 9)}`,
            day,
            periodId: pId,
            classId: asgn.classId,
            subjectId: asgn.subjectId,
            teacherId: asgn.teacherId,
          });

          classOccupied.set(cKey, true);
          teacherOccupied.set(tKey, true);
          placed++;
        }
      }
    }

    if (placed < needed) {
      console.warn(`Could only place ${placed}/${needed} periods for assignment ${asgn.id} (${asgn.subjectId} in ${asgn.classId})`);
    }
  }

  return entries;
}

export async function POST() {
  try {
    const data = getDataStore();

    if (!data.assignments || data.assignments.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No curriculum mappings found. Go to Classes → Manage Curriculum to assign teachers and subjects first.',
      });
    }

    const classPeriods = data.bellSchedule.filter(p => p.type === 'Class');
    if (classPeriods.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No academic periods found in the Bell Schedule.',
      });
    }

    // Validate: check total periods don't exceed available slots
    const totalSlots = data.days.length * classPeriods.length; // e.g. 6 days × 10 periods = 60
    for (const cls of data.classes) {
      const classAssignments = data.assignments.filter(a => a.classId === cls.id);
      const totalNeeded = classAssignments.reduce((sum, a) => sum + a.periodsPerWeek, 0);
      if (totalNeeded > totalSlots) {
        return NextResponse.json({
          success: false,
          message: `${cls.name} requires ${totalNeeded} periods/week but only ${totalSlots} slots are available. Reduce subject hours or add more periods.`,
        });
      }
    }

    // Generate
    const newTimetable = generateTimetable(data);
    updateDataStore({ ...data, timetable: newTimetable });

    // Summary
    const classBreakdown = data.classes.map(cls => {
      const count = newTimetable.filter(e => e.classId === cls.id).length;
      return `${cls.name}: ${count}`;
    }).join(', ');

    return NextResponse.json({
      success: true,
      message: `Generated ${newTimetable.length} slots successfully! [${classBreakdown}]`,
    });

  } catch (error: any) {
    console.error('GENERATOR ERROR:', error);
    return NextResponse.json({
      success: false,
      message: `Generator Error: ${error.message}`,
    }, { status: 200 });
  }
}
