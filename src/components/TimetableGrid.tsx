"use client";

import React from 'react';
import { Period, TimetableEntry, Subject, Teacher } from '@/data/mockData';

interface TimetableGridProps {
  days: string[];
  periods: Period[];
  entries: TimetableEntry[];
  subjects: Subject[];
  teachers: Teacher[];
  type: 'class' | 'teacher';
  onEditCell?: (day: string, periodId: string) => void;
  isEditMode?: boolean;
}

export default function TimetableGrid({ days, periods, entries, subjects, teachers, type, onEditCell, isEditMode }: TimetableGridProps) {
  const getEntry = (day: string, periodId: string) => {
    return entries.find(e => e.day === day && e.periodId === periodId);
  };

  const getSubject = (id: string) => subjects.find(s => s.id === id);
  const getTeacher = (id: string) => teachers.find(t => t.id === id);

  return (
    <div className="premium-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white/95 backdrop-blur-md p-4 text-left text-xs font-semibold uppercase text-slate-400 border-b border-r border-slate-100">
                Period
              </th>
              {days.map(day => (
                <th key={day} className="p-4 text-center text-xs font-semibold uppercase text-slate-400 border-b border-slate-100">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map(period => (
              <tr key={period.id}>
                <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-md p-4 border-r border-b border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">{period.name}</span>
                    <span className="text-[10px] text-slate-400">{period.startTime} - {period.endTime}</span>
                  </div>
                </td>
                {days.map(day => {
                  const entry = getEntry(day, period.id);
                  const subject = entry ? getSubject(entry.subjectId) : null;
                  const teacher = entry ? getTeacher(entry.teacherId) : null;
                  const isBreak = period.type === 'Break' || period.type === 'Lunch' || period.type === 'FruitBreak';

                  return (
                    <td 
                      key={`${day}-${period.id}`} 
                      onClick={() => isEditMode && !isBreak && onEditCell?.(day, period.id)}
                      className={`p-2 border-b border-slate-100 transition-all duration-300 ${isBreak ? 'bg-slate-50/80' : isEditMode ? 'cursor-pointer hover:bg-orange-50/30' : 'hover:bg-slate-50'}`}
                    >
                      {isBreak ? (
                        <div className="flex items-center justify-center py-4">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 rotate-90 sm:rotate-0">
                            {period.name}
                          </span>
                        </div>
                      ) : entry ? (
                        <div 
                          className="group relative h-full rounded-xl p-3 shadow-sm border border-slate-200 transition-all hover:shadow-md hover:border-slate-300"
                          style={{ 
                            backgroundColor: `${subject?.color}10`, 
                            borderLeft: `4px solid ${subject?.color}` 
                          }}
                        >
                          <p className="text-xs font-bold text-slate-900 mb-1">{subject?.name}</p>
                          <p className="text-[10px] text-slate-500 font-semibold uppercase">
                            {type === 'class' ? teacher?.name : entry.classId}
                          </p>
                          
                          {/* Hover Details */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center transition-opacity pointer-events-none">
                            <span className="text-[10px] text-white font-bold px-3 py-1 bg-orange-600 rounded-lg shadow-sm">
                              EDIT
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-16 flex items-center justify-center group">
                           <div className="h-1 w-4 rounded-full bg-slate-100 group-hover:w-8 transition-all group-hover:bg-slate-200" />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

