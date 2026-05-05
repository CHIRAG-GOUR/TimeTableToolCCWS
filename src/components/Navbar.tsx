"use client";

import React, { useState, useEffect } from 'react';
import { Search, Bell, Plus, X, Calendar, User, BookOpen, School, Clock, CheckCircle2, AlertCircle, Menu, Globe, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MockData, TimetableEntry } from '@/data/mockData';
import { SidebarContext } from './Sidebar';
import { useContext } from 'react';

export default function Navbar() {
  const { isCollapsed, setIsCollapsed } = useContext(SidebarContext);
  const [isAdding, setIsAdding] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState<'system' | 'news'>('system');
  const [selectedNews, setSelectedNews] = useState<any>(null);
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
  ];
  
  const [newsItems, setNewsItems] = useState([
    { 
      id: 1, 
      title: 'Summer Vacation 2026', 
      content: 'The Rajasthan Secondary Education Department has officially announced summer holidays for all state and private schools.', 
      location: 'Rajasthan', 
      source: 'Education Dept.', 
      time: 'Just now', 
      timestamp: Date.now(),
      factCheck: 'VERIFIED: Holidays are scheduled from May 17 to June 30, 2026. This matches the official Shivira calendar for the current academic session.'
    },
    { 
      id: 2, 
      title: 'Revised School Timings', 
      content: 'Due to severe heatwave conditions, all schools in Rajasthan will now operate on a revised single-shift schedule.', 
      location: 'Statewide', 
      source: 'DM Jaipur', 
      time: '2 mins ago', 
      timestamp: Date.now() - 120000,
      factCheck: 'VERIFIED: New timings are 7:30 AM to 12:00 PM. This applies to students only; teachers must follow regular hours until 1:00 PM.'
    },
    { 
      id: 3, 
      title: 'Class 5 & 8 Results Update', 
      content: 'Preliminary reports suggest the RBSE Class 5 and 8 results are entering the final tabulation phase.', 
      location: 'Rajasthan', 
      source: 'RBSE Board', 
      time: '15 mins ago', 
      timestamp: Date.now() - 900000,
      factCheck: 'VERIFIED: Results are expected by the last week of May. Official portal will host results for over 25 lakh students.'
    },
  ]);
  const [isSyncingNews, setIsSyncingNews] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time relative time updates
      setNewsItems(prev => prev.map(item => {
        const diff = Math.floor((Date.now() - item.timestamp) / 60000);
        let timeLabel = 'Just now';
        if (diff > 0 && diff < 60) timeLabel = `${diff} mins ago`;
        else if (diff >= 60) timeLabel = `${Math.floor(diff/60)} hours ago`;
        return { ...item, time: timeLabel };
      }));
    }, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, []);

  // Simulate new news arrival
  useEffect(() => {
    if (!isNotificationsOpen || notificationTab !== 'news') return;

    const syncTimer = setTimeout(() => {
      setIsSyncingNews(true);
      setTimeout(() => {
        setIsSyncingNews(false);
        // Occasionally add a "Breaking" news item if not already there
        setNewsItems(prev => {
          if (prev.some(n => n.title.includes('District Collector'))) return prev;
          return [
            { 
              id: Date.now(), 
              title: 'District Collector Heatwave Alert', 
              content: 'District administrations in Udaipur, Jodhpur, and Bikaner have issued a yellow alert for heatwaves.', 
              location: 'West Rajasthan', 
              source: 'IMD Alert', 
              time: 'Just now', 
              timestamp: Date.now(),
              factCheck: 'VERIFIED: Temperatures are forecasted to cross 45°C. Collectors have been authorized to announce temporary school closures if needed.'
            },
            ...prev
          ];
        });
      }, 2000);
    }, 5000);

    return () => clearTimeout(syncTimer);
  }, [isNotificationsOpen, notificationTab]);

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
                  <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">Notifications</h3>
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider">{notificationTab === 'system' ? '3 New' : '5 Updates'}</span>
                    </div>
                    <div className="flex p-1 bg-slate-100 rounded-xl">
                      <button 
                        onClick={() => setNotificationTab('system')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-lg transition-all ${notificationTab === 'system' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <Bell className="h-3 w-3" /> System
                      </button>
                      <button 
                        onClick={() => setNotificationTab('news')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-lg transition-all ${notificationTab === 'news' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <Globe className={`h-3 w-3 ${notificationTab === 'news' ? 'text-orange-600' : ''}`} /> Rajasthan News
                        <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto no-scrollbar">
                    {isSyncingNews && (
                      <div className="p-3 bg-orange-50/50 border-b border-orange-100 flex items-center justify-center gap-2">
                        <div className="h-3 w-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Checking for updates...</span>
                      </div>
                    )}
                    {notificationTab === 'system' ? (
                      notifications.map(n => (
                        <div key={n.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none cursor-pointer">
                          <div className={`h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0`}>
                            <n.icon className={`h-5 w-5 ${n.color}`} />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-slate-900">{n.title}</p>
                            <p className="text-xs text-slate-400">{n.time}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      newsItems.map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedNews(item)}
                          className="p-4 flex flex-col gap-2 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="h-5 w-5 rounded-md bg-orange-100 flex items-center justify-center">
                                <MapPin className="h-3 w-3 text-orange-600" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.location}</span>
                            </div>
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{item.source}</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{item.title}</p>
                            <p className="text-xs text-slate-500 leading-relaxed">{item.content}</p>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium pt-1">
                            <Clock className="h-3 w-3" /> {item.time}
                          </div>
                        </div>
                      ))
                    )}
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

      <NewsDetailModal 
        news={selectedNews} 
        onClose={() => setSelectedNews(null)} 
      />
    </>
  );
}

function NewsDetailModal({ news, onClose }: { news: any, onClose: () => void }) {
  if (!news) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
        >
          <div className="h-32 bg-gradient-to-r from-orange-500 to-orange-600 relative p-8">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/20">
                <Globe className="h-3 w-3 text-white" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">{news.source}</span>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <h2 className="text-2xl font-bold text-white mt-4 line-clamp-2">{news.title}</h2>
          </div>
          
          <div className="p-8">
            <div className="flex items-center gap-2 mb-4 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full w-fit border border-emerald-100">
              <CheckCircle2 className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Fact Checked & Verified</span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-slate-700 leading-relaxed mb-6 font-medium">
              {news.content}
            </div>

            <div className="bg-emerald-50/30 rounded-2xl p-6 border border-emerald-100/50 mb-8">
              <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-tighter mb-2 flex items-center gap-1.5">
                <Search className="h-3 w-3" /> Verification Details
              </h4>
              <p className="text-sm text-emerald-900/80 leading-relaxed italic">
                &quot;{news.factCheck}&quot;
              </p>
            </div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{news.location}</span>
              </div>
              <div className="h-4 w-px bg-slate-100" />
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">{news.time}</span>
              </div>
            </div>
            
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Full official directive issued by {news.location} administrative authorities. Schools are advised to monitor local weather warnings daily. Updates will be reflected in the Chronos generator automatically.
            </p>

            <button 
              onClick={onClose}
              className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 active:scale-95"
            >
              Understood
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function NewEntryModal({ isOpen, onClose, data, entry, setEntry, onSubmit }: any) {
  const [conflicts, setConflicts] = useState<{ type: 'teacher' | 'class', message: string }[]>([]);

  useEffect(() => {
    if (!data || !entry.day || !entry.periodId) return;

    const newConflicts: { type: 'teacher' | 'class', message: string }[] = [];

    // Check Teacher Conflict
    if (entry.teacherId) {
      const teacherConflict = data.timetable.find((e: any) => 
        e.day === entry.day && 
        e.periodId === entry.periodId && 
        e.teacherId === entry.teacherId
      );
      if (teacherConflict) {
        const teacher = data.teachers.find((t: any) => t.id === entry.teacherId);
        newConflicts.push({ 
          type: 'teacher', 
          message: `${teacher?.name} is already teaching Class ${teacherConflict.classId} at this time.` 
        });
      }
    }

    // Check Class Conflict
    if (entry.classId) {
      const classConflict = data.timetable.find((e: any) => 
        e.day === entry.day && 
        e.periodId === entry.periodId && 
        e.classId === entry.classId
      );
      if (classConflict) {
        const subject = data.subjects.find((s: any) => s.id === classConflict.subjectId);
        newConflicts.push({ 
          type: 'class', 
          message: `Class ${entry.classId} already has ${subject?.name} scheduled at this time.` 
        });
      }
    }

    setConflicts(newConflicts);
  }, [entry, data]);

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

            {/* Conflict Warnings */}
            <AnimatePresence>
              {conflicts.length > 0 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-8 space-y-2 overflow-hidden"
                >
                  {conflicts.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <p className="text-xs font-bold leading-tight">{c.message}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

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
                disabled={conflicts.length > 0}
                className={`flex-2 px-10 py-5 rounded-3xl font-bold text-sm shadow-2xl transition-all uppercase tracking-widest ${
                  conflicts.length > 0 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-orange-600 text-white shadow-orange-600/30 hover:bg-orange-500'
                }`}
              >
                {conflicts.length > 0 ? 'Fix Conflicts' : 'Save Entry'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

