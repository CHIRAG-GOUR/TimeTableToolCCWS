"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Mail, 
  Phone, 
  Calendar,
  MoreVertical,
  ChevronRight,
  Search,
  X,
  School,
  BookOpen,
  Clock,
  Download
} from 'lucide-react';
import { exportTeacherPDF } from '@/utils/exportUtils';
import { MockData, Teacher, TimetableEntry } from '@/data/mockData';
import TimetableGrid from '@/components/TimetableGrid';

export default function TeachersPage() {
  const [data, setData] = useState<MockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingTeacherId, setViewingTeacherId] = useState<string | null>(null);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', maxHours: 28 });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quick Add Entry for Teacher Modal
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickEntry, setQuickEntry] = useState({
    classId: '',
    subjectId: '',
    day: 'Monday',
    periodId: ''
  });

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        setLoading(false);
      });
  }, []);

  const handleAddTeacher = async () => {
    if (!data || !newTeacher.name) return;
    const teacher: Teacher = { id: `t-${Date.now()}`, name: newTeacher.name.toUpperCase(), maxHoursPerWeek: newTeacher.maxHours, subjects: [] };
    const updatedData = { ...data, teachers: [...data.teachers, teacher] };
    const res = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData) });
    if (res.ok) { setData(updatedData); setIsAddingTeacher(false); setNewTeacher({ name: '', maxHours: 28 }); }
  };

  const handleQuickAdd = async () => {
    if (!data || !viewingTeacherId || !quickEntry.classId || !quickEntry.subjectId || !quickEntry.periodId) return;
    
    const existingIndex = data.timetable.findIndex(e => 
      e.teacherId === viewingTeacherId && 
      e.day === quickEntry.day && 
      e.periodId === quickEntry.periodId
    );
    
    let updatedTimetable;
    if (existingIndex >= 0) {
      updatedTimetable = [...data.timetable];
      updatedTimetable[existingIndex] = { ...updatedTimetable[existingIndex], ...quickEntry };
    } else {
      const entry: TimetableEntry = { id: `m-${Date.now()}`, teacherId: viewingTeacherId, ...quickEntry };
      updatedTimetable = [...data.timetable, entry];
    }

    const updatedData = { ...data, timetable: updatedTimetable };
    const res = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData) });
    if (res.ok) { setData(updatedData); setIsQuickAdding(false); }
  };

  const handleDeleteEntry = async () => {
    if (!data || !viewingTeacherId || !quickEntry.day || !quickEntry.periodId) return;
    
    const updatedTimetable = data.timetable.filter(e => 
      !(e.teacherId === viewingTeacherId && e.day === quickEntry.day && e.periodId === quickEntry.periodId)
    );

    const updatedData = { ...data, timetable: updatedTimetable };
    const res = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData) });
    if (res.ok) { setData(updatedData); setIsQuickAdding(false); }
  };

  const handleEditCell = (day: string, periodId: string) => {
    const entry = data?.timetable.find(e => 
      e.teacherId === viewingTeacherId && e.day === day && e.periodId === periodId
    );
    if (entry) {
      setQuickEntry({
        classId: entry.classId,
        subjectId: entry.subjectId,
        day: entry.day,
        periodId: entry.periodId
      });
    } else {
      setQuickEntry({
        classId: '',
        subjectId: '',
        day: day,
        periodId: periodId
      });
    }
    setIsQuickAdding(true);
  };

  const handleMoveEntry = async (entryId: string, targetDay: string, targetPeriodId: string) => {
    if (!data) return;
    const updatedTimetable = data.timetable.map(e => 
      e.id === entryId ? { ...e, day: targetDay, periodId: targetPeriodId } : e
    );
    const updatedData = { ...data, timetable: updatedTimetable };
    const res = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData) });
    if (res.ok) setData(updatedData);
  };

  if (loading || !data) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
    </div>
  );

  const viewingTeacher = data.teachers.find(t => t.id === viewingTeacherId);
  const teacherEntries = data.timetable.filter(e => e.teacherId === viewingTeacherId);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Teacher Management</h1>
          <p className="mt-2 text-slate-500">Manage faculty workload and individual schedules.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={async () => {
              if (!data || data.teachers.length === 0) return;
              for (const teacher of data.teachers) {
                const entries = data.timetable.filter(e => e.teacherId === teacher.id);
                await exportTeacherPDF(
                  teacher.name, data.days, data.bellSchedule, entries,
                  data.subjects, data.classes, `${teacher.name}_Timetable`
                );
                await new Promise(r => setTimeout(r, 400));
              }
            }}
            className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download className="h-4 w-4" />
            All Teacher PDFs
          </button>
          <button 
            onClick={() => setIsAddingTeacher(true)}
            className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Teacher
          </button>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex gap-4">
        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <Users className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-emerald-900">Faculty Workload Management</p>
          <p className="text-xs text-emerald-700 leading-relaxed">
            Ensure each teacher's <b>Max Weekly Periods</b> is set correctly. The progress bar shows their current 
            assigned periods across all classes. Click <b>"View Schedule"</b> to manually add or adjust their 
            specific time slots if needed.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-2 px-4 max-w-md shadow-sm">
        <Search className="h-4 w-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by name or subject..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none text-sm text-slate-900 focus:ring-0 w-full placeholder:text-slate-400"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.teachers
          .filter(t => 
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            t.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .map((teacher) => {
          const workload = data.timetable.filter(e => e.teacherId === teacher.id).length;
          return (
            <motion.div 
              key={teacher.id}
              layoutId={teacher.id}
              className="premium-card p-6 flex flex-col group cursor-pointer"
              onClick={() => setViewingTeacherId(teacher.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-xl font-bold text-orange-600">
                  {teacher.name.charAt(0)}
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-slate-900">{teacher.name}</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {teacher.subjects.length > 0 ? (
                  teacher.subjects.map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">Faculty Member</span>
                )}
              </div>

              <div className="mt-6 space-y-3 flex-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Current Load</span>
                  <span className={workload > teacher.maxHoursPerWeek ? 'text-red-600 font-bold' : 'text-slate-700'}>
                    {workload} / {teacher.maxHoursPerWeek} periods
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                   <div 
                      className={`h-full rounded-full ${workload > teacher.maxHoursPerWeek ? 'bg-red-500' : 'bg-orange-600'}`}
                      style={{ width: `${Math.min((workload / teacher.maxHoursPerWeek) * 100, 100)}%` }}
                   />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex gap-2">
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       const entries = data.timetable.filter(en => en.teacherId === teacher.id);
                       exportTeacherPDF(
                         teacher.name, data.days, data.bellSchedule, entries,
                         data.subjects, data.classes, `${teacher.name}_Timetable`
                       );
                     }}
                     className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-orange-600 transition-colors"
                     title="Download PDF"
                   >
                     <Download className="h-3.5 w-3.5" />
                   </button>
                   <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                     <Mail className="h-3.5 w-3.5" />
                   </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-orange-600 group-hover:gap-2 transition-all">
                  VIEW SCHEDULE
                  <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add Teacher Modal */}
      <AnimatePresence>
        {isAddingTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingTeacher(false)} className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Add New Faculty</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                  <input type="text" value={newTeacher.name} onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })} placeholder="e.g. MR. RAJESH KUMAR" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Max Weekly Periods</label>
                  <input type="number" value={newTeacher.maxHours} onChange={(e) => setNewTeacher({ ...newTeacher, maxHours: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none" />
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setIsAddingTeacher(false)} className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={handleAddTeacher} className="flex-2 px-4 py-3 rounded-xl bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all">Create Teacher</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Teacher Schedule Modal */}
      <AnimatePresence>
        {viewingTeacherId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingTeacherId(null)} className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm" />
            <motion.div layoutId={viewingTeacherId} className="relative w-full max-w-6xl max-h-full bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-600/20">{viewingTeacher?.name.charAt(0)}</div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{viewingTeacher?.name}</h2>
                    <p className="text-xs text-slate-500 flex items-center gap-2"><Calendar className="h-3 w-3" />Weekly Teaching Schedule</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button
                     onClick={() => {
                       if (!viewingTeacher) return;
                       exportTeacherPDF(
                         viewingTeacher.name, data.days, data.bellSchedule, teacherEntries,
                         data.subjects, data.classes, `${viewingTeacher.name}_Timetable`
                       );
                     }}
                     className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all"
                   >
                     <Download className="h-4 w-4" />
                     PDF
                   </button>
                   <button onClick={() => setIsQuickAdding(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/20"><Plus className="h-4 w-4" />ADD SLOT</button>
                   <button onClick={() => setViewingTeacherId(null)} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <TimetableGrid 
                  days={data.days} 
                  periods={data.bellSchedule} 
                  entries={teacherEntries} 
                  subjects={data.subjects} 
                  teachers={data.teachers} 
                  classes={data.classes}
                  type="teacher" 
                  isEditMode={true}
                  onEditCell={handleEditCell}
                  onMoveEntry={handleMoveEntry}
                  title={`${viewingTeacher?.name} — Schedule`}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Add Modal within Teacher View */}
      <AnimatePresence>
        {isQuickAdding && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsQuickAdding(false)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 overflow-y-auto max-h-[90vh]">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Add Assignment Slot</h2>
              <p className="text-sm text-slate-500 mb-6">Assigning for {viewingTeacher?.name}</p>
              
              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><School className="h-3 w-3" /> Class</label>
                  <select value={quickEntry.classId} onChange={(e) => setQuickEntry({ ...quickEntry, classId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none">
                    <option value="">Select Class</option>
                    {data.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><BookOpen className="h-3 w-3" /> Subject</label>
                  <select value={quickEntry.subjectId} onChange={(e) => setQuickEntry({ ...quickEntry, subjectId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none">
                    <option value="">Select Subject</option>
                    {data.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Day</label>
                    <select value={quickEntry.day} onChange={(e) => setQuickEntry({ ...quickEntry, day: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none">
                      {data.days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock className="h-3 w-3" /> Period</label>
                    <select value={quickEntry.periodId} onChange={(e) => setQuickEntry({ ...quickEntry, periodId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none">
                      <option value="">Select Period</option>
                      {data.bellSchedule.filter(p => p.type === 'Class').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-3">
                <button onClick={() => setIsQuickAdding(false)} className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all">Discard</button>
                {data.timetable.some(e => e.teacherId === viewingTeacherId && e.day === quickEntry.day && e.periodId === quickEntry.periodId) && (
                  <button onClick={handleDeleteEntry} className="px-4 py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-all border border-red-100">Remove</button>
                )}
                <button onClick={handleQuickAdd} className="flex-2 px-4 py-3 rounded-xl bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all">
                  {data.timetable.some(e => e.teacherId === viewingTeacherId && e.day === quickEntry.day && e.periodId === quickEntry.periodId) ? 'Update Slot' : 'Add to Schedule'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
