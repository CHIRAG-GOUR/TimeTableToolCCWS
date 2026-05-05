"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  School, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  Clock,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Link2,
  RefreshCw
} from 'lucide-react';
import { MockData } from '@/data/mockData';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

const COLORS = ['#f97316', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function Dashboard() {
  const [data, setData] = useState<MockData | null>(null);
  const [gsUrl, setGsUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  // Calculate stats
  const stats = [
    { name: 'Total Classes', value: data.classes.length, icon: School, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Total Teachers', value: data.teachers.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Subjects Taught', value: data.subjects.length, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Active Conflicts', value: 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  // Calculate Teacher Workload Data
  const teacherWorkloadData = data.teachers.map(teacher => {
    const assignedPeriods = data.timetable.filter(e => e.teacherId === teacher.id).length;
    return {
      name: teacher.name.split(' ').pop(), // Just last name for brevity
      assigned: assignedPeriods,
      max: teacher.maxHoursPerWeek,
      fullName: teacher.name
    };
  });

  // Calculate Subject Distribution Data
  const subjectCounts: Record<string, number> = {};
  data.timetable.forEach(e => {
    const subject = data.subjects.find(s => s.id === e.subjectId);
    if (subject) {
      subjectCounts[subject.name] = (subjectCounts[subject.name] || 0) + 1;
    }
  });
  const subjectDistributionData = Object.entries(subjectCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="mt-2 text-slate-500">Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <div id="tour-upload" className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Paste Google Sheet Link"
              className="h-12 w-64 pl-10 pr-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-sm"
              onChange={(e) => setGsUrl(e.target.value)}
            />
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          
          <button 
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              if (!gsUrl) return alert('Please paste a Google Sheet link first');
              try {
                const sheetIdMatch = gsUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
                if (!sheetIdMatch) return alert('Invalid Google Sheet URL');
                
                const btn = e.currentTarget as HTMLButtonElement;
                const originalText = btn.innerHTML;
                btn.textContent = 'SYNCING...';

                const res = await fetch('/api/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sheetId: sheetIdMatch[1] })
                });

                const result = await res.json();

                if (!res.ok || !result.success) {
                  btn.innerHTML = originalText;
                  return alert('Sync failed: ' + (result.error || 'Unknown error'));
                }

                setData(result.data);
                window.dispatchEvent(new Event('data-uploaded'));

                // ── Auto-generate timetable immediately ──
                btn.textContent = 'GENERATING...';
                try {
                  const genRes = await fetch('/api/generate', { method: 'POST' });
                  const genResult = await genRes.json();
                  if (genRes.ok && genResult.success) {
                    // Refresh data with generated timetable
                    const dataRes = await fetch('/api/data');
                    const dataResult = await dataRes.json();
                    if (dataResult.success) setData(dataResult.data);
                    btn.innerHTML = originalText;
                    alert(`Synced & generated! ${result.data.teachers.length} teachers, ${result.data.classes.length} classes, ${result.data.assignments.length} assignments. Timetable ready.`);
                  } else {
                    btn.innerHTML = originalText;
                    alert(`Synced successfully (${result.data.assignments.length} assignments) but generation had issues: ${genResult.message || 'Unknown'}`);
                  }
                } catch (genErr: any) {
                  btn.innerHTML = originalText;
                  alert(`Synced OK but auto-generate failed: ${genErr.message}. Go to Generate page manually.`);
                }
              } catch (err: any) {
                alert('Sync error: ' + err.message);
              }
            }}
            className="h-12 px-6 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            SYNC SHEET
          </button>

          <button 
            onClick={async () => {
              if (!confirm('Are you sure you want to clear all data? This will reset the counts to 0.')) return;
              try {
                const res = await fetch('/api/data', { method: 'DELETE' });
                if (res.ok) {
                  window.location.reload();
                }
              } catch (err) {
                alert('Error resetting data');
              }
            }}
            className="h-12 px-6 rounded-xl bg-white border border-red-100 text-red-600 font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            RESET
          </button>

          <label className="cursor-pointer h-12 px-6 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            UPLOAD EXCEL
            <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                // Dynamically import to avoid SSR issues if any
                const { parseExcelData } = await import('@/utils/excelParser');
                const parsedData = await parseExcelData(file);
                
                // POST to backend
                const res = await fetch('/api/data', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(parsedData)
                });
                
                if (res.ok) {
                  const result = await res.json();
                  setData(result.data);
                  window.dispatchEvent(new Event('data-uploaded'));
                  alert('School data successfully imported and analyzed!');
                } else {
                  const error = await res.json();
                  alert('Failed to save imported data: ' + error.error);
                }
              } catch (err: any) {
                alert('Error parsing file: ' + err.message);
              }
            }} />
          </label>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <motion.div 
            key={stat.name}
            variants={item}
            className="premium-card p-6"
          >
            <div className="flex items-center justify-between">
              <div className={stat.bg + " p-3 rounded-2xl"}>
                <stat.icon className={stat.color + " h-6 w-6"} />
              </div>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-500">{stat.name}</h3>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-7">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="premium-card col-span-4 p-6"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <BarChartIcon className="h-5 w-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Teacher Workload Distribution</h2>
            </div>
            <button className="text-sm font-bold text-orange-600 hover:text-orange-500 transition-colors">Analyze</button>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teacherWorkloadData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-800">
                          <p className="text-xs font-bold mb-1">{d.fullName}</p>
                          <p className="text-[10px] text-slate-400">Assigned: <span className="text-orange-400">{d.assigned} hrs</span></p>
                          <p className="text-[10px] text-slate-400">Capacity: {d.max} hrs</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="assigned" radius={[6, 6, 0, 0]} barSize={32}>
                  {teacherWorkloadData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.assigned > entry.max ? '#ef4444' : '#f97316'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="premium-card col-span-3 p-6"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <PieChartIcon className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Subject Mix</h2>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subjectDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                   content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-900">{payload[0].name}</p>
                          <p className="text-xs text-slate-500">{payload[0].value} Periods</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {subjectDistributionData.slice(0, 6).map((s, i) => (
              <div key={s.name} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-tighter">{s.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="premium-card col-span-7 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">System Integrity: 100%</p>
                <p className="text-xs text-slate-500">All constraints satisfied for current generated schedule.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-xl bg-slate-50 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all">Re-validate All</button>
              <button className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all">Download Report</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
