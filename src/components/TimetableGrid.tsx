"use client";

import React, { useRef } from 'react';
import { Period, TimetableEntry, Subject, Teacher } from '@/data/mockData';
import { Download, FileText, Table as TableIcon } from 'lucide-react';
import { exportToPDF, exportToExcel } from '@/utils/exportUtils';

interface TimetableGridProps {
  days: string[];
  periods: Period[];
  entries: TimetableEntry[];
  subjects: Subject[];
  teachers: Teacher[];
  type?: 'class' | 'teacher' | 'room';
  title?: string;
  isEditMode?: boolean;
  onEditCell?: (day: string, pId: string) => void;
  onMoveEntry?: (entryId: string, targetDay: string, targetPeriodId: string) => void;
}

export default function TimetableGrid({ days, periods, entries, subjects, teachers, type, title, onEditCell, onMoveEntry, isEditMode }: TimetableGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const gridId = `timetable-grid-${type || 'default'}-${Date.now()}`;

  const getEntry = (day: string, periodId: string) => {
    return entries.find(e => e.day === day && e.periodId === periodId);
  };

  const getSubject = (id: string) => subjects.find(s => s.id === id);
  const getTeacher = (id: string) => teachers.find(t => t.id === id);

  const handleExportPDF = () => {
    exportToPDF(gridId, `${title || 'Timetable'}`);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <FileText className="h-3.5 w-3.5 text-red-500" />
            Export PDF
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <TableIcon className="h-3.5 w-3.5 text-emerald-500" />
            Export Excel
          </button>
        </div>
      </div>

      <div id={gridId} ref={gridRef} className="premium-card overflow-hidden bg-white">
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
                        onClick={() => isEditMode && !isBreak && !entry && onEditCell?.(day, period.id)}
                        onDragOver={isEditMode && !isBreak ? handleDragOver : undefined}
                        onDrop={isEditMode && !isBreak ? (e) => handleDrop(e, day, period.id) : undefined}
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
                            draggable={isEditMode}
                            onDragStart={(e) => handleDragStart(e, entry.id)}
                            className={`group relative h-full rounded-xl p-3 shadow-sm border border-slate-200 transition-all ${isEditMode ? 'cursor-move hover:shadow-md hover:border-orange-300 active:scale-95' : 'hover:shadow-md hover:border-slate-300'}`}
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
                            {isEditMode && (
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditCell?.(day, period.id);
                                }}
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center transition-opacity cursor-pointer"
                              >
                                <span className="text-[10px] text-white font-bold px-3 py-1 bg-orange-600 rounded-lg shadow-sm">
                                  EDIT
                                </span>
                              </div>
                            )}
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
    </div>
  );
}



