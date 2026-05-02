"use client";

import React, { useEffect, useState } from 'react';
import { School, Plus, ChevronRight, Layers, X, Trash2, User, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MockData, ClassSection, Assignment } from '@/data/mockData';

export default function ClassesPage() {
  const [data, setData] = useState<MockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  
  // Assignment Modal State
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [newAssignment, setNewAssignment] = useState({
    subjectId: '',
    teacherId: '',
    periods: 5
  });

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        setLoading(false);
      });
  }, []);

  const handleAdd = async () => {
    if (!data || !newName) return;
    const newCls: ClassSection = { id: `c-${Date.now()}`, name: newName.toUpperCase() };
    const updatedData = { ...data, classes: [...data.classes, newCls] };
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });
    if (res.ok) {
      setData(updatedData);
      setIsAdding(false);
      setNewName('');
    }
  };

  const handleAddAssignment = async () => {
    if (!data || !editingClassId || !newAssignment.subjectId || !newAssignment.teacherId) return;
    
    const assign: Assignment = {
      id: `a-${Date.now()}`,
      classId: editingClassId,
      subjectId: newAssignment.subjectId,
      teacherId: newAssignment.teacherId,
      periodsPerWeek: newAssignment.periods
    };

    const updatedData = {
      ...data,
      assignments: [...data.assignments, assign]
    };

    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });

    if (res.ok) {
      setData(updatedData);
      setNewAssignment({ subjectId: '', teacherId: '', periods: 5 });
    }
  };

  const removeAssignment = async (id: string) => {
    if (!data) return;
    const updatedData = {
      ...data,
      assignments: data.assignments.filter(a => a.id !== id)
    };
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });
    if (res.ok) setData(updatedData);
  };

  if (loading || !data) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
    </div>
  );

  const editingClass = data.classes.find(c => c.id === editingClassId);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Class Sections</h1>
          <p className="mt-2 text-slate-500">Manage academic sections and their curriculum mapping.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </button>
      </div>

      {/* Guidance Alert */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex gap-4">
        <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
          <Layers className="h-5 w-5 text-orange-600" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-orange-900">Curriculum Mapping Guide</p>
          <p className="text-xs text-orange-700 leading-relaxed">
            Use the <b>"Manage Curriculum"</b> button on each class card to define which teachers handle which subjects. 
            You must also specify the <b>Class Teacher</b> and the number of <b>Periods per Week</b> for every subject. 
            The AI Generator uses this data to build the final timetable.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {data.classes.map((cls) => {
          const classAssignments = data.assignments.filter(a => a.classId === cls.id);
          const totalPeriods = classAssignments.reduce((acc, a) => acc + a.periodsPerWeek, 0);

          return (
            <div key={cls.id} className="premium-card p-6 flex flex-col sm:flex-row gap-6">
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl min-w-[120px] border border-slate-100">
                <School className="h-8 w-8 text-orange-600 mb-2" />
                <span className="text-xl font-bold text-slate-900">{cls.name}</span>
                {cls.classTeacherId && (
                  <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-100">
                    <User className="h-2.5 w-2.5 text-orange-600" />
                    <span className="text-[9px] font-bold text-orange-600 uppercase tracking-tighter">
                      {data.teachers.find(t => t.id === cls.classTeacherId)?.name.split(' ').pop()}
                    </span>
                  </div>
                )}
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Section</span>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-orange-600" />
                    Assigned Curriculum
                  </h3>
                  <span className="text-xs font-bold text-slate-900">{totalPeriods} Periods/Week</span>
                </div>

                <div className="grid gap-2">
                  {classAssignments.length > 0 ? classAssignments.map((a) => {
                    const subject = data.subjects.find(s => s.id === a.subjectId);
                    const teacher = data.teachers.find(t => t.id === a.teacherId);
                    return (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: subject?.color }} />
                          <div>
                            <p className="text-xs font-bold text-slate-800">{subject?.name}</p>
                            <p className="text-[10px] text-slate-500">{teacher?.name}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-slate-600">{a.periodsPerWeek}p</span>
                      </div>
                    );
                  }) : (
                    <div className="py-4 text-center border-2 border-dashed border-slate-100 rounded-xl">
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No Assignments Yet</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setEditingClassId(cls.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-orange-600 hover:text-orange-500 transition-colors pt-2"
                >
                  MANAGE CURRICULUM
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Section Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Add New Section</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Section Name</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. GRADE XII-A"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setIsAdding(false)} className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={handleAdd} className="flex-2 px-4 py-3 rounded-xl bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all">Create Section</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Curriculum Modal */}
      <AnimatePresence>
        {editingClassId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingClassId(null)}
              className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Manage Curriculum</h2>
                  <p className="text-sm text-slate-500">Mapping for {editingClass?.name}</p>
                </div>
                <button onClick={() => setEditingClassId(null)} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Class Teacher Selection */}
                <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-3">
                  <label className="text-[10px] font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                    <User className="h-3 w-3" /> Designated Class Teacher
                  </label>
                  <select 
                    value={editingClass?.classTeacherId || ''}
                    onChange={async (e) => {
                      if (!data || !editingClassId) return;
                      const updatedClasses = data.classes.map(c => 
                        c.id === editingClassId ? { ...c, classTeacherId: e.target.value } : c
                      );
                      const updatedData = { ...data, classes: updatedClasses };
                      const res = await fetch('/api/data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedData),
                      });
                      if (res.ok) setData(updatedData);
                    }}
                    className="w-full bg-white border border-orange-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-bold"
                  >
                    <option value="">Select Class Teacher</option>
                    {data.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                {/* Current Assignments List */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Assignments</label>
                  <div className="grid gap-2">
                    {data.assignments.filter(a => a.classId === editingClassId).map(a => {
                      const s = data.subjects.find(sub => sub.id === a.subjectId);
                      const t = data.teachers.find(tea => tea.id === a.teacherId);
                      return (
                        <div key={a.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                          <div className="flex items-center gap-4">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s?.color }} />
                            <div>
                              <p className="text-sm font-bold text-slate-900">{s?.name}</p>
                              <p className="text-xs text-slate-500">{t?.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <span className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200">{a.periodsPerWeek}p/week</span>
                             <button onClick={() => removeAssignment(a.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                               <Trash2 className="h-4 w-4" />
                             </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px bg-slate-100 w-full" />

                {/* Add New Assignment Form */}
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add New Assignment</label>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500">Subject</label>
                       <select 
                        value={newAssignment.subjectId}
                        onChange={(e) => setNewAssignment({ ...newAssignment, subjectId: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none"
                       >
                         <option value="">Select Subject</option>
                         {data.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500">Teacher</label>
                       <select 
                        value={newAssignment.teacherId}
                        onChange={(e) => setNewAssignment({ ...newAssignment, teacherId: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none"
                       >
                         <option value="">Select Teacher</option>
                         {data.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500">Periods/Week</label>
                       <input 
                        type="number"
                        value={newAssignment.periods}
                        onChange={(e) => setNewAssignment({ ...newAssignment, periods: parseInt(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-orange-500/20 outline-none"
                       />
                    </div>
                  </div>
                  <button 
                    onClick={handleAddAssignment}
                    className="w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    ADD TO CURRICULUM
                  </button>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setEditingClassId(null)}
                  className="px-8 py-3 rounded-2xl bg-orange-600 text-white font-bold text-sm shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all"
                >
                  Save & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
