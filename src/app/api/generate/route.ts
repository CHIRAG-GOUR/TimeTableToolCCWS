import { NextResponse } from 'next/server';
import { getDataStore, updateDataStore, TimetableEntry, Assignment } from '@/data/mockData';
import { CpModel, CpSolver, CpSolverStatus } from 'cpsat-js';

/**
 * Advanced Timetable Generator using Google OR-Tools CP-SAT (via cpsat-js)
 */
async function generateTimetableAdvanced(data: ReturnType<typeof getDataStore>): Promise<TimetableEntry[] | null> {
  const { teachers, classes, assignments, days, bellSchedule, subjects } = data;
  const classPeriods = bellSchedule.filter(p => p.type === 'Class');
  const model = new CpModel();

  // Helper for summing variables
  const sum = (vars: any[]) => {
    if (vars.length === 0) return 0;
    let total = vars[0].toLinearExpr();
    for (let i = 1; i < vars.length; i++) {
      total = total.plus(vars[i].toLinearExpr());
    }
    return total;
  };

  // 1. Variables: x[assignmentId][day][periodId]
  const x: Record<string, Record<string, Record<string, any>>> = {};

  for (const asgn of assignments) {
    x[asgn.id] = {};
    for (const day of days) {
      x[asgn.id][day] = {};
      for (const period of classPeriods) {
        x[asgn.id][day][period.id] = model.newBoolVar(`${asgn.id}_${day}_${period.id}`);
      }
    }
  }

  // 2. Constraint: Each assignment must meet its required periods per week
  for (const asgn of assignments) {
    const vars = [];
    for (const day of days) {
      for (const period of classPeriods) {
        vars.push(x[asgn.id][day][period.id]);
      }
    }
    model.addLinearConstraint(sum(vars), asgn.periodsPerWeek, asgn.periodsPerWeek);
  }

  // 3. Constraint: No class double-booking (one subject per slot)
  for (const cls of classes) {
    const classAssignments = assignments.filter(a => a.classId === cls.id);
    for (const day of days) {
      for (const period of classPeriods) {
        const vars = classAssignments.map(a => x[a.id][day][period.id]);
        model.addLinearConstraint(sum(vars), 0, 1);
      }
    }
  }

  // 4. Constraint: No teacher double-booking
  for (const teacher of teachers) {
    const teacherAssignments = assignments.filter(a => a.teacherId === teacher.id);
    for (const day of days) {
      for (const period of classPeriods) {
        const vars = teacherAssignments.map(a => x[a.id][day][period.id]);
        model.addLinearConstraint(sum(vars), 0, 1);
      }
    }
  }

  // 5. Constraint: Teacher max hours per week
  for (const teacher of teachers) {
    const teacherAssignments = assignments.filter(a => a.teacherId === teacher.id);
    const vars = [];
    for (const a of teacherAssignments) {
      for (const day of days) {
        for (const period of classPeriods) {
          vars.push(x[a.id][day][period.id]);
        }
      }
    }
    if (vars.length > 0) {
      model.addLinearConstraint(sum(vars), 0, teacher.maxHoursPerWeek);
    }
  }

  // 6. Constraint: Subject Variety (Max 2 of same subject per day per class)
  for (const asgn of assignments) {
    for (const day of days) {
      const vars = classPeriods.map(p => x[asgn.id][day][p.id]);
      model.addLinearConstraint(sum(vars), 0, 2);
    }
  }

  // 7. ADVANCED CONSTRAINT: No more than 2 labs per day per class (dynamically adjusted if mathematically impossible)
  const labSubjectIds = subjects
    .filter(s => s.isAllenBlock || s.name.toLowerCase().includes('lab') || s.name.toLowerCase().includes('practical'))
    .map(s => s.id);

  for (const cls of classes) {
    const labAssignmentsForClass = assignments.filter(a => a.classId === cls.id && labSubjectIds.includes(a.subjectId));
    
    if (labAssignmentsForClass.length > 0) {
      const totalLabPeriods = labAssignmentsForClass.reduce((sum, a) => sum + a.periodsPerWeek, 0);
      const minLabsPerDayNeeded = Math.ceil(totalLabPeriods / days.length);
      const maxLabsPerDay = Math.max(2, minLabsPerDayNeeded);

      for (const day of days) {
        const vars: any[] = [];
        labAssignmentsForClass.forEach(a => {
          classPeriods.forEach(p => {
            vars.push(x[a.id][day][p.id]);
          });
        });
        if (vars.length > 0) {
          model.addLinearConstraint(sum(vars), 0, maxLabsPerDay);
        }
      }
    }
  }

  // 8. Solve
  const solver = await CpSolver.create();
  const result = solver.solve(model);

  if (result.status === CpSolverStatus.FEASIBLE || result.status === CpSolverStatus.OPTIMAL) {
    const entries: TimetableEntry[] = [];
    for (const asgn of assignments) {
      for (const day of days) {
        for (const period of classPeriods) {
          if (result.value(x[asgn.id][day][period.id]) > 0.5) {
            entries.push({
              id: `gen-${Math.random().toString(36).substr(2, 9)}`,
              day,
              periodId: period.id,
              classId: asgn.classId,
              subjectId: asgn.subjectId,
              teacherId: asgn.teacherId,
            });
          }
        }
      }
    }
    return entries;
  }

  return null;
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

    // Generate using Advanced Solver
    const newTimetable = await generateTimetableAdvanced(data);

    if (newTimetable) {
      updateDataStore({ ...data, timetable: newTimetable });
      
      const classBreakdown = data.classes.map(cls => {
        const count = newTimetable.filter(e => e.classId === cls.id).length;
        return `${cls.name}: ${count}`;
      }).join(', ');

      return NextResponse.json({
        success: true,
        message: `Advanced Solver found an optimal schedule with ${newTimetable.length} slots! [${classBreakdown}]`,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Solver could not find a feasible schedule with the current constraints. Please check for teacher availability or class overloads.',
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
