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
  Clock
} from 'lucide-react';
import { MockData } from '@/data/mockData';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  const stats = [
    { name: 'Total Classes', value: data?.classes.length || 0, icon: School, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Total Teachers', value: data?.teachers.length || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Subjects Taught', value: data?.subjects.length || 0, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Active Conflicts', value: 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
        <p className="mt-2 text-slate-500">Welcome back, Admin. Here's what's happening today.</p>
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Teacher Workload Summary</h2>
            <button className="text-sm font-medium text-orange-600 hover:text-orange-500 transition-colors">View Details</button>
          </div>
          <div className="space-y-4">
            {data?.teachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                  {teacher.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 font-medium">{teacher.name}</span>
                    <span className="text-slate-500 text-xs">12 / {teacher.maxHoursPerWeek} hrs</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 rounded-full" 
                      style={{ width: `${(12 / teacher.maxHoursPerWeek) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="premium-card col-span-3 p-6"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Quick Status</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Generation Ready</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">All teachers have subjects assigned and class requirements are met.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Last Generated</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">May 01, 2026 - 03:45 PM</p>
              </div>
            </div>

            <button className="w-full mt-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all">
              Download Latest Report
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
