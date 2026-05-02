"use client";

import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Settings2, Trash2, X, User, School, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MockData, Subject } from '@/data/mockData';

export default function SubjectsPage() {
  const [data, setData] = useState<MockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', color: '#4f46e5', isAllen: false });

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        setLoading(false);
      });
  }, []);

  const handleAdd = async () => {
    if (!data || !newSub.name) return;
    const subject: Subject = { id: `s-${Date.now()}`, name: newSub.name.toUpperCase(), color: newSub.color, isAllenBlock: newSub.isAllen };
    const updatedData = { ...data, subjects: [...data.subjects, subject] };
    const res = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData) });
    if (res.ok) { setData(updatedData); setIsAdding(false); setNewSub({ name: '', color: '#4f46e5', isAllen: false }); }
  };

  if (loading || !data) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Subject Mapping</h1>
          <p className="mt-2 text-slate-500">Define subjects and view faculty distribution across classes.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Subject
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex gap-4">
        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <BookOpen className="h-5 w-5 text-amber-600" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-amber-900">Subject Architecture</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Subjects defined here are used globally. Use the <b>"Special Block"</b> toggle for non-academic 
            periods like Games or Skillizee. You can view the distribution of faculty across different classes 
            for each subject directly on the cards below.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.subjects.map((subject) => {
          const assignments = data.assignments.filter(a => a.subjectId === subject.id);
          const uniqueTeachers = Array.from(new Set(assignments.map(a => a.teacherId)));

          return (
            <div key={subject.id} className="premium-card p-6 flex flex-col group">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: subject.color }}
                >
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-slate-400 hover:text-slate-600"><Settings2 className="h-4 w-4" /></button>
                  <button className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">{subject.name}</h3>
                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${subject.isAllenBlock ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                   {subject.isAllenBlock ? 'SPECIAL BLOCK' : 'ACADEMIC'}
                </span>
              </div>

              <div className="space-y-4 flex-1">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <User className="h-3 w-3" /> Assigned Faculty ({uniqueTeachers.length})
                   </label>
                   <div className="flex flex-wrap gap-2">
                      {uniqueTeachers.map(tId => {
                        const t = data.teachers.find(teacher => teacher.id === tId);
                        return (
                          <span key={tId} className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">
                            {t?.name}
                          </span>
                        );
                      })}
                      {uniqueTeachers.length === 0 && <span className="text-xs text-slate-400 italic">No teachers assigned</span>}
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <School className="h-3 w-3" /> Class Distribution
                   </label>
                   <div className="grid gap-1.5">
                      {assignments.map(a => {
                        const c = data.classes.find(cls => cls.id === a.classId);
                        const t = data.teachers.find(tea => tea.id === a.teacherId);
                        return (
                          <div key={a.id} className="flex items-center justify-between text-[11px] p-2 bg-slate-50/50 rounded-lg border border-slate-100/50">
                             <div className="flex items-center gap-2">
                               <span className="font-bold text-slate-700">{c?.name}</span>
                               <ArrowRight className="h-3 w-3 text-slate-300" />
                               <span className="text-slate-500 font-medium">{t?.name}</span>
                             </div>
                             <span className="font-bold text-slate-400">{a.periodsPerWeek}p</span>
                          </div>
                        );
                      })}
                      {assignments.length === 0 && <span className="text-xs text-slate-400 italic">Not mapped to any class</span>}
                   </div>
                </div>
              </div>
            </div>
          );
        })}
        
        <button 
          onClick={() => setIsAdding(true)}
          className="premium-card border-dashed border-slate-200 bg-transparent flex flex-col items-center justify-center p-8 gap-4 hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-600 min-h-[300px]"
        >
          <div className="h-12 w-12 rounded-full border-2 border-dashed border-current flex items-center justify-center">
            <Plus className="h-6 w-6" />
          </div>
          <span className="text-sm font-bold">Create New Subject</span>
        </button>
      </div>

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
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Add New Subject</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Subject Name</label>
                  <input type="text" value={newSub.name} onChange={(e) => setNewSub({ ...newSub, name: e.target.value })} placeholder="e.g. Physics" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Theme Color</label>
                  <div className="flex gap-2">
                     <input type="color" value={newSub.color} onChange={(e) => setNewSub({ ...newSub, color: e.target.value })} className="h-12 w-12 rounded-lg bg-transparent border-none cursor-pointer" />
                     <input type="text" value={newSub.color} onChange={(e) => setNewSub({ ...newSub, color: e.target.value })} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-900 font-mono" />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                   <input type="checkbox" id="isAllen" checked={newSub.isAllen} onChange={(e) => setNewSub({ ...newSub, isAllen: e.target.checked })} className="h-5 w-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500" />
                   <label htmlFor="isAllen" className="text-sm font-medium text-slate-700">Special Block (e.g. Coaching/Labs)</label>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setIsAdding(false)} className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={handleAdd} className="flex-2 px-4 py-3 rounded-xl bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all">Create Subject</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
