"use client";

import React, { useRef } from 'react';
import { Period, TimetableEntry, Subject, Teacher } from '@/data/mockData';
import { Download, FileText, Table as TableIcon, Plus } from 'lucide-react';
import { exportToPDF, exportToExcel } from '@/utils/exportUtils';

interface TimetableGridProps {
  days: string[];
  periods: Period[];
  entries: TimetableEntry[];
  subjects: Subject[];
  teachers: Teacher[];
  classes?: { id: string, name: string }[];
  type?: 'class' | 'teacher' | 'room';
  title?: string;
  isEditMode?: boolean;
  onEditCell?: (day: string, pId: string) => void;
  onMoveEntry?: (entryId: string, targetDay: string, targetPeriodId: string) => void;
}

// Filler subjects for empty slots — alternates Hobby / Games per day
const FILLER_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  Hobby: {
    bg: 'bg-violet-50',
    border: 'border-l-violet-500',
    text: 'text-violet-700',
    label: 'Hobby Period',
  },
  Games: {
    bg: 'bg-emerald-50',
    border: 'border-l-emerald-500',
    text: 'text-emerald-700',
    label: 'Games / Sports',
  },
};

const DAY_FILLER_MAP: Record<string, string> = {
  Monday: 'Hobby',
  Tuesday: 'Games',
  Wednesday: 'Hobby',
  Thursday: 'Games',
  Friday: 'Hobby',
  Saturday: 'Games',
};

export default function TimetableGrid({ days, periods, entries, subjects, teachers, classes, type, title, onEditCell, onMoveEntry, isEditMode }: TimetableGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const gridId = `timetable-grid-${type || 'default'}-${Date.now()}`;

  const getEntry = (day: string, periodId: string) => {
    return entries.find(e => e.day === day && e.periodId === periodId);
  };

  const getSubject = (id: string) => subjects.find(s => s.id === id);
  const getTeacher = (id: string) => teachers.find(t => t.id === id);
  const getClass = (id: string) => classes?.find(c => c.id === id);

  const handleExportPDF = () => {
    exportToPDF(gridId, `${title || 'Timetable'}`, {
      days,
      periods,
      entries,
      subjects,
      teachers,
      className: title || 'Timetable',
    });
  };

  const handleExportExcel = () => {
    exportToExcel(days, periods, entries, subjects, teachers, `${title || 'Timetable'}`);
  };

  const handleDragStart = (e: React.DragEvent, entryId: string) => {
    e.dataTransfer.setData('entryId', entryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, day: string, periodId: string) => {
    e.preventDefault();
    const entryId = e.dataTransfer.getData('entryId');
    if (entryId && onMoveEntry) {
      onMoveEntry(entryId, day, periodId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const toMin = (t: string) => {
    const parts = t.replace('.', ':').split(':').map(Number);
    let h = parts[0]; const m = parts[1] || 0;
    if (h < 7) h += 12;
    return h * 60 + m;
  };

  return (
    <div className="space-y-3">
      {/* Header bar with title + export buttons */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <FileText className="h-3.5 w-3.5 text-red-500" />
            PDF
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <TableIcon className="h-3.5 w-3.5 text-emerald-500" />
            Excel
          </button>
        </div>
      </div>

      {/* Scrollable timetable grid */}
      <div id={gridId} ref={gridRef} className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full border-collapse" style={{ minWidth: `${120 + days.length * 160}px` }}>
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-slate-50 p-3 text-left text-[11px] font-bold uppercase text-slate-500 border-b-2 border-r border-slate-200 w-[120px] min-w-[120px]">
                  Period
                </th>
                {days.map(day => (
                  <th key={day} className="p-3 text-center text-[11px] font-bold uppercase text-slate-500 border-b-2 border-slate-200 min-w-[140px]">
                    {day.substring(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => {
                const isBreak = period.type === 'Break' || period.type === 'Lunch' || period.type === 'FruitBreak';
                const dur = toMin(period.endTime) - toMin(period.startTime);

                return (
                  <tr key={period.id} className={isBreak ? 'bg-slate-50/60' : ''}>
                    {/* Period label column — sticky */}
                    <td className="sticky left-0 z-10 bg-white p-2.5 border-r border-b border-slate-100">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-slate-800">{period.name}</span>
                        <span className="text-[10px] text-slate-400 leading-tight">{period.startTime}–{period.endTime}</span>
                        {period.type === 'Class' && (
                          <span className="text-[9px] font-semibold text-orange-500/80">{dur} min</span>
                        )}
                      </div>
                    </td>

                    {/* Day cells */}
                    {days.map(day => {
                      const entry = getEntry(day, period.id);
                      const subject = entry ? getSubject(entry.subjectId) : null;
                      const teacher = entry ? getTeacher(entry.teacherId) : null;

                      return (
                        <td 
                          key={`${day}-${period.id}`} 
                          className={`p-1.5 border-b border-slate-100 transition-all ${
                            isBreak ? 'bg-slate-50/80' : isEditMode ? 'cursor-pointer hover:bg-orange-50/20' : ''
                          }`}
                          onDragOver={isEditMode && !isBreak ? handleDragOver : undefined}
                          onDrop={isEditMode && !isBreak ? (e) => handleDrop(e, day, period.id) : undefined}
                        >
                          {isBreak ? (
                            /* Break / Lunch / Fruit Break row */
                            <div className="flex items-center justify-center py-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                                {period.name}
                              </span>
                            </div>
                          ) : entry && subject ? (
                            /* Filled slot */
                            <div 
                              draggable={isEditMode}
                              onDragStart={(e) => handleDragStart(e, entry.id)}
                              className={`group relative rounded-lg p-2.5 border transition-all ${
                                isEditMode 
                                  ? 'cursor-move ring-1 ring-orange-500/20 hover:shadow-md active:scale-95' 
                                  : 'hover:shadow-sm'
                              }`}
                              style={{ 
                                backgroundColor: `${subject.color}12`, 
                                borderColor: `${subject.color}30`,
                                borderLeftWidth: '3px',
                                borderLeftColor: subject.color,
                              }}
                            >
                              <p className="text-[11px] font-bold text-slate-800 leading-tight mb-0.5 truncate">{subject.name}</p>
                              <p className="text-[9px] text-slate-500 font-medium truncate">
                                {type === 'class' ? teacher?.name : (getClass(entry.classId)?.name || entry.classId)}
                              </p>
                              {isEditMode && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onEditCell?.(day, period.id); }}
                                  className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center rounded-full bg-orange-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Edit slot"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-2 w-2">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ) : (
                            /* Empty slot → fill with Hobby or Games */
                            (() => {
                              if (isEditMode) {
                                return (
                                  <div 
                                    className="h-14 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 cursor-pointer"
                                    onClick={() => onEditCell?.(day, period.id)}
                                  >
                                    <Plus className="h-4 w-4 text-slate-300 group-hover:text-orange-400 transition-all" />
                                  </div>
                                );
                              }
                              // Auto-fill: alternate Hobby/Games by day
                              const fillerType = DAY_FILLER_MAP[day] || 'Hobby';
                              const style = FILLER_STYLES[fillerType];
                              return (
                                <div className={`rounded-lg p-2.5 border border-l-[3px] ${style.bg} ${style.border} border-opacity-30`}>
                                  <p className={`text-[11px] font-bold leading-tight mb-0.5 ${style.text}`}>{style.label}</p>
                                  <p className="text-[9px] text-slate-400 font-medium">Activity</p>
                                </div>
                              );
                            })()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
