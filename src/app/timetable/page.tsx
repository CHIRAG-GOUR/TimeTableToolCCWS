"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Share2,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { MockData, TimetableEntry } from '@/data/mockData';
import TimetableGrid from '@/components/TimetableGrid';
import ShareModal from '@/components/ShareModal';
import { exportToImage, exportToPDF, exportToExcel } from '@/utils/exportUtils';

export default function TimetablePage() {
  const [data, setData] = useState<MockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [showShareToast, setShowShareToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Link copied to clipboard!');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editCell, setEditCell] = useState<{ day: string; pId: string } | null>(null);

  const [editForm, setEditForm] = useState({ subjectId: '', teacherId: '' });

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setData(json.data);
          
          // Check if there's a classId in the URL
          const urlParams = new URLSearchParams(window.location.search);
          const classIdFromUrl = urlParams.get('class');
          
          if (classIdFromUrl && json.data.classes.some((c: any) => c.id === classIdFromUrl)) {
            setSelectedClassId(classIdFromUrl);
          } else if (json.data.classes.length > 0) {
            setSelectedClassId(json.data.classes[0].id);
          }
        }
        setLoading(false);
      });
  }, []);

  const handleExport = async (format: 'image' | 'pdf' | 'excel') => {
    if (!data) return;
    const selectedClassName = data.classes.find(c => c.id === selectedClassId)?.name || 'Class';
    
    if (format === 'excel') {
      const classEntries = data.timetable.filter(e => e.classId === selectedClassId);
      exportToExcel(data.days, data.bellSchedule, classEntries, data.subjects, data.teachers, selectedClassName);
    } else if (format === 'image') {
      await exportToImage('timetable-capture-area', `${selectedClassName}_Timetable`);
    } else if (format === 'pdf') {
      const classEntries = data.timetable.filter(e => e.classId === selectedClassId);
      await exportToPDF('timetable-capture-area', `${selectedClassName}_Timetable`, {
        days: data.days,
        periods: data.bellSchedule,
        entries: classEntries,
        subjects: data.subjects,
        teachers: data.teachers,
        className: selectedClassName,
      });
    }
    
    setToastMessage(`Exporting as ${format.toUpperCase()}...`);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 3000);
    setIsShareModalOpen(false);
  };

  const handleShareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('class', selectedClassId);
    navigator.clipboard.writeText(url.toString());
    setToastMessage('Shareable link copied to clipboard!');
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 3000);
  };

  const handleEditCell = (day: string, pId: string) => {
    const entry = data?.timetable.find(e => e.day === day && e.periodId === pId && e.classId === selectedClassId);
    setEditCell({ day, pId });
    setEditForm({
      subjectId: entry?.subjectId || '',
      teacherId: entry?.teacherId || ''
    });
  };

  const saveManualEdit = async () => {
    if (!data || !editCell) return;

    // Filter out the old entry for this slot
    const otherEntries = data.timetable.filter(e => 
      !(e.day === editCell.day && e.periodId === editCell.pId && e.classId === selectedClassId)
    );

    const newEntry: TimetableEntry = {
      id: `manual-${Date.now()}`,
      day: editCell.day,
      periodId: editCell.pId,
      classId: selectedClassId,
      subjectId: editForm.subjectId,
      teacherId: editForm.teacherId
    };

    const updatedData = {
      ...data,
      timetable: [...otherEntries, newEntry]
    };

    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });

    if (res.ok) {
      setData(updatedData);
      setEditCell(null);
    }
  };

  const handleMoveEntry = async (entryId: string, targetDay: string, targetPeriodId: string) => {
    if (!data) return;

    const entryToMove = data.timetable.find(e => e.id === entryId);
    if (!entryToMove) return;

    // Check for Teacher double-booking in target slot
    const teacherConflict = data.timetable.find(e => 
      e.day === targetDay && 
      e.periodId === targetPeriodId && 
      e.teacherId === entryToMove.teacherId &&
      e.id !== entryId
    );

    if (teacherConflict) {
      const teacher = data.teachers.find(t => t.id === entryToMove.teacherId);
      const conflictClass = data.classes.find(c => c.id === teacherConflict.classId)?.name;
      setToastMessage(`Conflict: ${teacher?.name} is busy with ${conflictClass} at this time.`);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
      return;
    }

    // Logic for Swap vs Move
    const targetEntry = data.timetable.find(e => e.day === targetDay && e.periodId === targetPeriodId && e.classId === selectedClassId);
    
    let updatedTimetable = [...data.timetable];

    if (targetEntry) {
      // SWAP
      updatedTimetable = updatedTimetable.map(e => {
        if (e.id === entryToMove.id) return { ...e, day: targetDay, periodId: targetPeriodId };
        if (e.id === targetEntry.id) return { ...e, day: entryToMove.day, periodId: entryToMove.periodId };
        return e;
      });
      setToastMessage(`Swapped ${data.subjects.find(s => s.id === entryToMove.subjectId)?.name || 'Subject'} with ${data.subjects.find(s => s.id === targetEntry.subjectId)?.name || 'Subject'}`);
    } else {
      // MOVE
      updatedTimetable = updatedTimetable.map(e => {
        if (e.id === entryToMove.id) return { ...e, day: targetDay, periodId: targetPeriodId };
        return e;
      });
      setToastMessage(`Moved to ${targetDay} Period ${targetPeriodId}`);
    }

    const updatedData = { ...data, timetable: updatedTimetable };

    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });

    if (res.ok) {
      setData(updatedData);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    }
  };

  if (loading || !data) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
    </div>
  );

  const classEntries = data.timetable.filter(e => e.classId === selectedClassId);
  const selectedClassName = data.classes.find(c => c.id === selectedClassId)?.name || 'Class';

  return (
    <div className="space-y-4 animate-in print:p-0">
      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onExport={handleExport}
        onShareLink={handleShareLink}
        className={selectedClassName}
      />

      {/* Toast notification */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: showShareToast ? 20 : -100, opacity: showShareToast ? 1 : 0 }}
        className="fixed top-0 left-1/2 -translate-x-1/2 z-[110] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold pointer-events-none"
      >
        <CheckCircle2 className="h-5 w-5 text-orange-400" />
        {toastMessage}
      </motion.div>

      {/* Compact toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{selectedClassName} Timetable</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Academic Year 2026-27 • Junior Schedule (9:30 AM – 4:30 PM)</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex h-9 px-3 items-center justify-center rounded-lg border transition-all font-bold text-[11px] gap-1.5 ${isEditMode ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'}`}
          >
            <Filter className={`h-3.5 w-3.5 ${isEditMode ? 'fill-amber-500' : ''}`} />
            {isEditMode ? 'EXIT EDIT' : 'EDIT'}
          </button>
          
          <button 
            onClick={() => handleExport('pdf')}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm transition-all"
            title="Download PDF"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white shadow-md shadow-orange-600/20 hover:bg-orange-500 transition-all"
            title="Share"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Class selector tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar print:hidden border-b border-slate-100">
         {data.classes.map(cls => (
           <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`relative py-2 px-3 text-xs font-bold transition-colors whitespace-nowrap rounded-t-lg ${
                selectedClassId === cls.id 
                  ? 'text-orange-600 bg-orange-50 border border-b-0 border-slate-200' 
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
              }`}
           >
             {cls.name}
           </button>
         ))}
      </div>

      {/* Timetable Grid — full width */}
      <div id="timetable-capture-area" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {/* Print-only Header */}
        <div className="hidden print:block text-center p-6 border-b-2 border-slate-900">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">{selectedClassName}</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Academic Year 2026-27 | Weekly Schedule</p>
        </div>

        <TimetableGrid 
          days={data.days}
          periods={data.bellSchedule}
          entries={classEntries}
          subjects={data.subjects}
          teachers={data.teachers}
          classes={data.classes}
          type="class"
          title={`${selectedClassName} — Weekly Schedule`}
          isEditMode={isEditMode}
          onEditCell={handleEditCell}
          onMoveEntry={handleMoveEntry}
        />
      </div>

      {/* Color legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold print:hidden">
        <span className="text-slate-400 uppercase tracking-wider">Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-violet-100 border border-violet-300" />
          <span className="text-violet-700">Hobby Period</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-emerald-100 border border-emerald-300" />
          <span className="text-emerald-700">Games / Sports</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-slate-100 border border-slate-300" />
          <span className="text-slate-500">Break / Lunch</span>
        </div>
      </div>

      {/* Manual Edit Modal */}
      {editCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Edit Slot</h3>
              <p className="text-sm text-slate-500">{editCell.day} — {data.bellSchedule.find(p => p.id === editCell.pId)?.name}</p>
            </div>

            {/* Conflict Warning */}
            {(() => {
              const conflict = data.timetable.find(e => 
                e.day === editCell.day && 
                e.periodId === editCell.pId && 
                e.teacherId === editForm.teacherId && 
                e.teacherId !== '' &&
                e.classId !== selectedClassId
              );
              
              if (conflict) {
                const conflictClass = data.classes.find(c => c.id === conflict.classId)?.name;
                return (
                  <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 font-medium">
                      <b>Conflict:</b> Teacher is already assigned to <b>{conflictClass}</b> during this period.
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</label>
                <select 
                  value={editForm.subjectId}
                  onChange={(e) => setEditForm({ ...editForm, subjectId: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Empty Slot</option>
                  {data.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teacher</label>
                <select 
                  value={editForm.teacherId}
                  onChange={(e) => setEditForm({ ...editForm, teacherId: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Unassigned</option>
                  {data.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setEditCell(null)}
                className="flex-1 h-10 rounded-lg bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveManualEdit}
                disabled={data.timetable.some(e => 
                  e.day === editCell.day && 
                  e.periodId === editCell.pId && 
                  e.teacherId === editForm.teacherId && 
                  e.teacherId !== '' &&
                  e.classId !== selectedClassId
                )}
                className="flex-1 h-10 rounded-lg bg-orange-600 text-white font-bold text-sm hover:bg-orange-500 shadow-lg shadow-orange-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
