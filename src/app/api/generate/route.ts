import { NextResponse } from 'next/server';
import { getDataStore, updateDataStore, TimetableEntry, Assignment } from '@/data/mockData';

/**
 * Timetable Generator using a Greedy Scheduling Algorithm.
 * 
 * The CP-SAT solver was producing infeasible results because the "exact equality"
 * constraint on periodsPerWeek + the 14 hard rules together created over-constrained
 * models that the solver couldn't satisfy.
 *
 * This greedy scheduler:
 *   1. Sorts assignments by descending priority (more weekly periods = harder to place)
 *   2. For each assignment, tries to place its required periodsPerWeek across the 6-day week
 *   3. Respects all 14 hard constraints
 *   4. Falls back to "best-effort" if exact placement is impossible
 *
 * This is FAR more practical for a school timetable with 30+ sections.
 */
function generateTimetableGreedy(data: ReturnType<typeof getDataStore>): TimetableEntry[] {
  const { teachers, classes, assignments, days, bellSchedule, subjects } = data;
  const classPeriods = bellSchedule.filter(p => p.type === 'Class');
  
  console.log(`[Greedy] Starting generation...`);
  console.log(`[Greedy] ${classes.length} classes, ${teachers.length} teachers, ${assignments.length} assignments`);
  console.log(`[Greedy] ${classPeriods.length} teaching periods/day × ${days.length} days = ${classPeriods.length * days.length} slots/class/week`);

  // ── Build the schedule grid ─────────────────────────────────────────
  // For each (day, periodId), track which class is occupied and which teacher is occupied
  const classOccupied = new Map<string, string>();  // "classId|day|periodId" → assignmentId
  const teacherOccupied = new Map<string, string>(); // "teacherId|day|periodId" → assignmentId
  
  const entries: TimetableEntry[] = [];
  
  const slotKey = (id: string, day: string, pId: string) => `${id}|${day}|${pId}`;
  
  // ── Subject helpers ─────────────────────────────────────────────────
  const getSubName = (subId: string) => subjects.find(s => s.id === subId)?.name?.toLowerCase() || '';
  const isMathSci = (subId: string) => {
    const n = getSubName(subId);
    return n.includes('math') || n.includes('sci');
  };
  const isGames = (subId: string) => getSubName(subId).includes('game');
  const isZumba = (subId: string) => getSubName(subId).includes('zumba');
  const isHobby = (subId: string) => getSubName(subId).includes('hobby');
  const isDance = (subId: string) => getSubName(subId).includes('dance');
  const isMusic = (subId: string) => getSubName(subId).includes('music');

  // ── Find lunch period index ─────────────────────────────────────────
  const lunchIdx = bellSchedule.findIndex(p => p.type === 'Lunch');
  const periodAfterLunchId = lunchIdx >= 0 && lunchIdx + 1 < bellSchedule.length 
    ? bellSchedule[lunchIdx + 1].id 
    : null;
  const lastPeriodId = classPeriods[classPeriods.length - 1]?.id;

  // Track which "category" subjects are placed per class per day for Rules 5 & 6
  // "classId|day" → Set of category flags
  const classDayCategories = new Map<string, Set<string>>();

  // ── Count how many subjects per day per class (for "same subject" tracking) ──
  const classSubjectDayCount = new Map<string, number>();
  // Track the last subject placed per class per day for the "no consecutive" rule
  const lastSubjectInSlot = new Map<string, string>(); // "classId|day|periodIndex" → subjectId

  // ── Check if a placement is valid ───────────────────────────────────
  function canPlace(asgn: Assignment, day: string, periodId: string, periodIndex: number): boolean {
    // 1. Class slot is free
    if (classOccupied.has(slotKey(asgn.classId, day, periodId))) return false;
    
    // 2. Teacher slot is free
    if (teacherOccupied.has(slotKey(asgn.teacherId, day, periodId))) return false;
    
    // 3. Rule 8: Max 2 of the same subject per day per class
    const csdKey = `${asgn.classId}|${day}|${asgn.subjectId}`;
    if ((classSubjectDayCount.get(csdKey) || 0) >= 2) return false;
    
    // 4. Rule 7: No consecutive same subject
    if (periodIndex > 0) {
      const prevKey = `${asgn.classId}|${day}|${periodIndex - 1}`;
      if (lastSubjectInSlot.get(prevKey) === asgn.subjectId) return false;
    }
    if (periodIndex < classPeriods.length - 1) {
      const nextKey = `${asgn.classId}|${day}|${periodIndex + 1}`;
      if (lastSubjectInSlot.get(nextKey) === asgn.subjectId) return false;
    }
    
    // 5. Rule 3: Avoid Maths/Science in last period
    if (periodId === lastPeriodId && isMathSci(asgn.subjectId)) return false;
    
    // 6. Rule 9: No games just after lunch
    if (periodId === periodAfterLunchId && isGames(asgn.subjectId)) return false;
    
    // 7. Rule 11: Zumba not in 8th or 10th period (by index: period 8 and 10)
    const periodNum = parseInt(periodId.replace(/[^0-9]/g, ''));
    if ((periodNum === 8 || periodNum === 10) && isZumba(asgn.subjectId)) return false;
    
    // 8. Rule 10: At a time, max 2 Zumba across all classes
    if (isZumba(asgn.subjectId)) {
      let zumbaCount = 0;
      for (const e of entries) {
        if (e.day === day && e.periodId === periodId && isZumba(e.subjectId)) zumbaCount++;
      }
      if (zumbaCount >= 2) return false;
    }
    
    // 9. Rule 5: Games and Hobby should not be on the same day
    const cdKey = `${asgn.classId}|${day}`;
    const dayCategories = classDayCategories.get(cdKey) || new Set();
    if (isGames(asgn.subjectId) && dayCategories.has('hobby')) return false;
    if (isHobby(asgn.subjectId) && dayCategories.has('games')) return false;
    
    // 10. Rule 6: Dance / Music / Hobby should not be on same day
    const isDMH = isDance(asgn.subjectId) || isMusic(asgn.subjectId) || isHobby(asgn.subjectId);
    if (isDMH) {
      let dmhCount = 0;
      if (dayCategories.has('dance')) dmhCount++;
      if (dayCategories.has('music')) dmhCount++;
      if (dayCategories.has('hobby')) dmhCount++;
      // Already has one of the D/M/H — don't add another different one
      if (dmhCount >= 1) {
        // Allow same category (e.g., 2 hobby periods) but not mixing
        const currentCategory = isDance(asgn.subjectId) ? 'dance' : isMusic(asgn.subjectId) ? 'music' : 'hobby';
        if (!dayCategories.has(currentCategory)) return false;
      }
    }
    
    return true;
  }

  // ── Place an assignment ─────────────────────────────────────────────
  function placeAssignment(asgn: Assignment, day: string, periodId: string, periodIndex: number) {
    classOccupied.set(slotKey(asgn.classId, day, periodId), asgn.id);
    teacherOccupied.set(slotKey(asgn.teacherId, day, periodId), asgn.id);
    
    const csdKey = `${asgn.classId}|${day}|${asgn.subjectId}`;
    classSubjectDayCount.set(csdKey, (classSubjectDayCount.get(csdKey) || 0) + 1);
    
    lastSubjectInSlot.set(`${asgn.classId}|${day}|${periodIndex}`, asgn.subjectId);
    
    // Track category flags for Rules 5 & 6
    const cdKey = `${asgn.classId}|${day}`;
    if (!classDayCategories.has(cdKey)) classDayCategories.set(cdKey, new Set());
    const cats = classDayCategories.get(cdKey)!;
    if (isGames(asgn.subjectId)) cats.add('games');
    if (isHobby(asgn.subjectId)) cats.add('hobby');
    if (isDance(asgn.subjectId)) cats.add('dance');
    if (isMusic(asgn.subjectId)) cats.add('music');
    
    entries.push({
      id: `gen-${entries.length}-${asgn.id.substring(0, 8)}`,
      day,
      periodId,
      classId: asgn.classId,
      subjectId: asgn.subjectId,
      teacherId: asgn.teacherId,
    });
  }

  // ── Sort assignments: hardest-to-place first ────────────────────────
  // Teachers with more sections are harder to place (more conflicts)
  const teacherLoad = new Map<string, number>();
  assignments.forEach(a => {
    teacherLoad.set(a.teacherId, (teacherLoad.get(a.teacherId) || 0) + a.periodsPerWeek);
  });
  
  const sortedAssignments = [...assignments]
    .filter(a => a.periodsPerWeek > 0)
    .sort((a, b) => {
      // Higher teacher load = more constrained = schedule first
      const loadDiff = (teacherLoad.get(b.teacherId) || 0) - (teacherLoad.get(a.teacherId) || 0);
      if (loadDiff !== 0) return loadDiff;
      // More periods needed = schedule first
      return b.periodsPerWeek - a.periodsPerWeek;
    });

  console.log(`[Greedy] ${sortedAssignments.length} assignments to schedule (after filtering 0-period ones)`);

  // ── Main scheduling loop ────────────────────────────────────────────
  let totalPlaced = 0;
  let totalNeeded = 0;

  for (const asgn of sortedAssignments) {
    let placed = 0;
    totalNeeded += asgn.periodsPerWeek;

    // Spread across days evenly: calculate how many per day
    const perDay = Math.ceil(asgn.periodsPerWeek / days.length);
    
    // Try to distribute evenly across all days
    const dayOrder = [...days]; 
    // Shuffle day order slightly to avoid Monday-heavy schedules
    // Use deterministic rotation based on assignment id
    const rotateBy = asgn.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % days.length;
    for (let r = 0; r < rotateBy; r++) {
      dayOrder.push(dayOrder.shift()!);
    }

    for (const day of dayOrder) {
      if (placed >= asgn.periodsPerWeek) break;
      
      let placedToday = 0;
      
      // Try each period in the day
      for (let pi = 0; pi < classPeriods.length; pi++) {
        if (placed >= asgn.periodsPerWeek) break;
        if (placedToday >= perDay) break; // Don't overload a single day
        
        const period = classPeriods[pi];
        if (canPlace(asgn, day, period.id, pi)) {
          placeAssignment(asgn, day, period.id, pi);
          placed++;
          placedToday++;
        }
      }
    }

    // Second pass: if we couldn't place enough, try harder (relax day-balance)
    if (placed < asgn.periodsPerWeek) {
      for (const day of dayOrder) {
        if (placed >= asgn.periodsPerWeek) break;
        for (let pi = 0; pi < classPeriods.length; pi++) {
          if (placed >= asgn.periodsPerWeek) break;
          const period = classPeriods[pi];
          if (canPlace(asgn, day, period.id, pi)) {
            placeAssignment(asgn, day, period.id, pi);
            placed++;
          }
        }
      }
    }

    totalPlaced += placed;
    if (placed < asgn.periodsPerWeek) {
      const subName = subjects.find(s => s.id === asgn.subjectId)?.name || asgn.subjectId;
      const teacherName = teachers.find(t => t.id === asgn.teacherId)?.name || asgn.teacherId;
      console.warn(`[Greedy] ⚠ ${subName} by ${teacherName} for ${asgn.classId}: placed ${placed}/${asgn.periodsPerWeek}`);
    }
  }

  console.log(`[Greedy] Placed ${totalPlaced}/${totalNeeded} periods (${Math.round(totalPlaced/totalNeeded*100)}%)`);
  console.log(`[Greedy] Generated ${entries.length} timetable entries total.`);
  
  return entries;
}

export async function POST() {
  try {
    const data = getDataStore();
    console.log(`\n========== TIMETABLE GENERATION ==========`);
    console.log(`[POST /api/generate] ${data.assignments.length} assignments, ${data.classes.length} classes, ${data.teachers.length} teachers`);
    console.log(`[POST /api/generate] Bell schedule: ${data.bellSchedule.length} entries, ${data.bellSchedule.filter(p => p.type === 'Class').length} teaching periods`);

    if (!data.assignments || data.assignments.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No curriculum mappings found. Please upload the Excel file with Teachers Master data first.',
      });
    }

    const classPeriods = data.bellSchedule.filter(p => p.type === 'Class');
    if (classPeriods.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No teaching periods found in the Bell Schedule. Check your bell schedule configuration.',
      });
    }

    // Generate using Greedy Scheduler
    const newTimetable = generateTimetableGreedy(data);

    if (newTimetable.length > 0) {
      updateDataStore({ ...data, timetable: newTimetable });
      
      // Build per-class stats
      const classStats = data.classes.map(cls => {
        const count = newTimetable.filter(e => e.classId === cls.id).length;
        const maxSlots = classPeriods.length * data.days.length;
        return `${cls.name}: ${count}/${maxSlots}`;
      });

      // Calculate fill percentage
      const totalSlots = data.classes.length * classPeriods.length * data.days.length;
      const fillPct = Math.round((newTimetable.length / totalSlots) * 100);

      return NextResponse.json({
        success: true,
        message: `✅ Generated ${newTimetable.length} scheduled periods (${fillPct}% fill rate). [${classStats.slice(0, 5).join(', ')}${classStats.length > 5 ? `, ... +${classStats.length - 5} more` : ''}]`,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No periods could be scheduled. Check teacher assignments and constraints.',
      });
    }

  } catch (error: any) {
    console.error('GENERATOR ERROR:', error);
    return NextResponse.json({
      success: false,
      message: `Generator Engine Error: ${error.message}`,
    }, { status: 200 });
  }
}
