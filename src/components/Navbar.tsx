"use client";

import React, { useState, useEffect } from 'react';
import { Search, Bell, Plus, X, Calendar, User, BookOpen, School, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MockData, TimetableEntry } from '@/data/mockData';

export default function Navbar() {
  const [isAdding, setIsAdding] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [data, setData] = useState<MockData | null>(null);
  const [entry, setEntry] = useState({
    classId: '',
    subjectId: '',
    teacherId: '',
    day: 'Monday',
    periodId: ''
  });

  const notifications = [
    { id: 1, title: 'AI Generation Complete', time: '2 mins ago', icon: CheckCircle2, color: 'text-emerald-500' },
    { id: 2, title: 'Teacher Conflict Detected', time: '1 hour ago', icon: AlertCircle, color: 'text-amber-500' },
    { id: 3, title: 'New Class Added: IX-C', time: '5 hours ago', icon: School, color: 'text-orange-500' },
  ];

  useEffect(() => {
    if (isAdding) {
      fetch('/api/data')
        .then(res => res.json())
        .then(json => {
          if (json.success) setData(json.data);
        });
    }
  }, [isAdding]);

  const handleSubmit = async () => {
    if (!data || !entry.classId || !entry.subjectId || !entry.teacherId || !entry.periodId) return;

    const newEntry: TimetableEntry = {
      id: `m-${Date.now()}`,
      ...entry
    };

    const updatedData = {
      ...data,
      timetable: [...data.timetable, newEntry]
    };

    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });

    if (res.ok) {
      setIsAdding(false);
      alert('Manual entry added successfully!');
    }
  };

  return (
    <>
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-8 backdrop-blur-md print:hidden transition-colors">
      <div className="flex w-96 items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search classes, teachers..." 
            className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsAdding(true)}
          className="flex h-10 items-center gap-2 rounded-full bg-orange-600 px-4 text-sm font-semibold text-white shadow-md shadow-orange-600/20 transition-all hover:bg-orange-50 hover:shadow-orange-600/30"
        >
          <Plus className="h-4 w-4" />
          <span>New Entry</span>
        </button>

        <div className="h-8 w-px bg-slate-200 mx-2" />

        <div className="relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 ${isNotificationsOpen ? 'ring-2 ring-orange-500/20 border-orange-500' : ''}`}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Notifications</h3>
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider">3 New</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none cursor-pointer">
                        <div className={`h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0`}>
                          <n.icon className={`h-5 w-5 ${n.color}`} />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-slate-900">{n.title}</p>
                          <p className="text-xs text-slate-400">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full p-3 text-xs font-bold text-orange-600 bg-slate-50 hover:bg-slate-100 transition-colors uppercase tracking-widest">
                    View All Activity
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
    <NewEntryModal 
      isOpen={isAdding} 
      onClose={() => setIsAdding(false)} 
      data={data} 
      entry={entry} 
      setEntry={setEntry} 
      onSubmit={handleSubmit} 
    />
    </>
  );
}

function NewEntryModal({ isOpen, onClose, data, entry, setEntry, onSubmit }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-200 overflow-y-auto max-h-[90vh] no-scrollbar"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <Plus className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Manual Override</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">New Entry</h2>
              </div>
              <button onClick={onClose} className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <School className="h-3 w-3" /> Class
                </label>
                <select 
                  value={entry.classId}
                  onChange={(e) => setEntry({ ...entry, classId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all appearance-none font-medium"
                >
                  <option value="">Select Class</option>
                  {data?.classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <User className="h-3 w-3" /> Teacher
                </label>
                <select 
                  value={entry.teacherId}
                  onChange={(e) => setEntry({ ...entry, teacherId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all appearance-none font-medium"
                >
                  <option value="">Select Teacher</option>
                  {data?.teachers.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <BookOpen className="h-3 w-3" /> Subject
                </label>
                <select 
                  value={entry.subjectId}
                  onChange={(e) => setEntry({ ...entry, subjectId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all appearance-none font-medium"
                >
                  <option value="">Select Subject</option>
                  {data?.subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Calendar className="h-3 w-3" /> Day
                </label>
                <select 
                  value={entry.day}
                  onChange={(e) => setEntry({ ...entry, day: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all appearance-none font-medium"
                >
                  {data?.days.map((d: any) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="space-y-4 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Clock className="h-3 w-3" /> Period / Time Slot
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {data?.bellSchedule.filter((p: any) => p.type === 'Class').map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => setEntry({ ...entry, periodId: p.id })}
                      className={`px-3 py-4 rounded-2xl border text-xs font-bold transition-all ${
                        entry.periodId === p.id 
                          ? 'bg-orange-600 border-orange-600 text-white shadow-xl shadow-orange-600/20 scale-95' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-orange-300 hover:bg-white'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 flex gap-4">
              <button 
                onClick={onClose}
                className="flex-1 px-4 py-5 rounded-3xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all uppercase tracking-widest"
              >
                Discard
              </button>
              <button 
                onClick={onSubmit}
                className="flex-2 px-10 py-5 rounded-3xl bg-orange-600 text-white font-bold text-sm shadow-2xl shadow-orange-600/30 hover:bg-orange-500 transition-all uppercase tracking-widest"
              >
                Save Entry
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
