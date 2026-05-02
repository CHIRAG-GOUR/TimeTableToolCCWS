"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Share2,
  Filter,
  Info,
  CheckCircle2
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
      await exportToPDF('timetable-capture-area', `${selectedClassName}_Timetable`);
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

  if (loading || !data) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
    </div>
  );

  const classEntries = data.timetable.filter(e => e.classId === selectedClassId);
  const selectedClassName = data.classes.find(c => c.id === selectedClassId)?.name || 'Class';

  return (
    <div className="space-y-6 animate-in print:p-0">
      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onExport={handleExport}
        onShareLink={handleShareLink}
        className={selectedClassName}
      />

      {/* Share Toast */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: showShareToast ? 20 : -100, opacity: showShareToast ? 1 : 0 }}
        className="fixed top-0 left-1/2 -translate-x-1/2 z-[110] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold pointer-events-none"
      >
        <CheckCircle2 className="h-5 w-5 text-orange-400" />
        {toastMessage}
      </motion.div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Academic Schedule</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{selectedClassName} Timetable</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-white border border-slate-200 p-1 shadow-sm">
            <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="px-3 py-2 text-sm font-bold text-slate-700 border-x border-slate-100">
              Week 12 (May 2026)
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex h-10 px-4 items-center justify-center rounded-xl border transition-all font-bold text-xs gap-2 ${isEditMode ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'}`}
          >
            <Filter className={`h-4 w-4 ${isEditMode ? 'fill-amber-500' : ''}`} />
            {isEditMode ? 'EXIT QUICK-EDIT' : 'QUICK-EDIT MODE'}
          </button>
          
          <button 
            onClick={() => handleExport('pdf')}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm transition-all"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all"
            title="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Guidance Section */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-4 print:hidden">
        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <Info className="h-5 w-5 text-blue-600" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-blue-900">How to use this page</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            Select a class below to view its specific timetable. Use the <b>Download</b> icon to export high-quality files, 
            or the <b>Share</b> icon to send the timetable link to teachers and students.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between py-2 border-y border-slate-100 print:hidden">
        <div className="flex items-center gap-6 overflow-x-auto pb-1 no-scrollbar">
           {data.classes.map(cls => (
             <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`relative py-2 text-sm font-bold transition-colors whitespace-nowrap ${selectedClassId === cls.id ? 'text-orange-600' : 'text-slate-400 hover:text-slate-700'}`}
             >
               {cls.name}
               {selectedClassId === cls.id && (
                 <motion.div layoutId="activeTab" className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-orange-600 rounded-full" />
               )}
             </button>
           ))}
        </div>
        
        <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 ml-4 shrink-0">
          <Filter className="h-3 w-3" />
          <span>ADVANCED FILTERS</span>
        </button>
      </div>

      {/* Capture Area for Image/PDF */}
      <div id="timetable-capture-area" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {/* Print-only Header (Inside Capture Area) */}
        <div className="hidden print:block text-center p-8 border-b-2 border-slate-900">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">{selectedClassName}</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Academic Year 2026-27 | Weekly Schedule</p>
        </div>

        <TimetableGrid 
          days={data.days}
          periods={data.bellSchedule}
          entries={classEntries}
          subjects={data.subjects}
          teachers={data.teachers}
          type="class"
          isEditMode={isEditMode}
          onEditCell={handleEditCell}
        />
      </div>

      {/* Manual Edit Modal */}
      {editCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
          >
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Manual Slot Override</h3>
              <p className="text-sm text-slate-500">{editCell.day} - {data.bellSchedule.find(p => p.id === editCell.pId)?.name}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Subject</label>
                <select 
                  value={editForm.subjectId}
                  onChange={(e) => setEditForm({ ...editForm, subjectId: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Empty Slot</option>
                  {data.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assign Teacher</label>
                <select 
                  value={editForm.teacherId}
                  onChange={(e) => setEditForm({ ...editForm, teacherId: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Unassigned</option>
                  {data.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setEditCell(null)}
                className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
              >
                CANCEL
              </button>
              <button 
                onClick={saveManualEdit}
                className="flex-1 h-12 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-500 shadow-lg shadow-orange-600/20 transition-all"
              >
                SAVE CHANGES
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
         <div className="premium-card p-4 flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Core Subjects</span>
            <span className="ml-auto text-sm font-bold text-slate-900">12 Periods</span>
         </div>
         <div className="premium-card p-4 flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Labs/Practical</span>
            <span className="ml-auto text-sm font-bold text-slate-900">4 Periods</span>
         </div>
         <div className="premium-card p-4 flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Extracurricular</span>
            <span className="ml-auto text-sm font-bold text-slate-900">2 Periods</span>
         </div>
         <div className="premium-card p-4 flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Empty Slots</span>
            <span className="ml-auto text-sm font-bold text-slate-900">3 Slots</span>
         </div>
      </div>
    </div>
  );
}
