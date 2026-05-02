"use client";

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Users, 
  Layers, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';

export default function ConstraintsPage() {
  const [constraints, setConstraints] = useState([
    { 
      id: 'teacher-uniq', 
      name: 'Teacher Uniqueness', 
      desc: 'Ensures a teacher is never in two classes at the same time.', 
      type: 'Hard', 
      active: true,
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    { 
      id: 'class-uniq', 
      name: 'Class Exclusivity', 
      desc: 'Ensures a class only has one subject at any given period.', 
      type: 'Hard', 
      active: true,
      icon: Layers,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    { 
      id: 'max-load', 
      name: 'Teacher Max Load', 
      desc: 'Strictly enforces the maximum weekly periods per faculty.', 
      type: 'Hard', 
      active: true,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    { 
      id: 'no-gaps', 
      name: 'Minimize Gaps', 
      desc: 'Tries to keep teacher schedules compact without long idle periods.', 
      type: 'Soft', 
      active: false,
      icon: AlertCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    }
  ]);

  const toggleConstraint = (id: string) => {
    setConstraints(constraints.map(c => 
      c.id === id ? { ...c, active: !c.active } : c
    ));
  };

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Solver Constraints</h1>
          <p className="mt-2 text-slate-500">Configure the rules the AI uses to generate your timetable.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
           <ShieldCheck className="h-4 w-4" />
           <span className="text-sm font-bold uppercase tracking-wider">Engine: Valid</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {constraints.map((c) => (
          <div key={c.id} className="premium-card p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-2xl ${c.bg}`}>
                <c.icon className={`h-6 w-6 ${c.color}`} />
              </div>
              <button 
                onClick={() => toggleConstraint(c.id)}
                className={`transition-colors ${c.active ? 'text-orange-600' : 'text-slate-300'}`}
              >
                {c.active ? <ToggleRight className="h-10 w-10" /> : <ToggleLeft className="h-10 w-10" />}
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.type === 'Hard' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                  {c.type}
                </span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{c.desc}</p>
            </div>

            <div className="pt-4 flex items-center gap-2 text-xs text-slate-400">
              <Info className="h-3 w-3" />
              <span>{c.active ? 'Currently being enforced in generation' : 'Currently ignored by solver'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
         <h2 className="text-lg font-bold text-slate-900">Advanced Solver Settings</h2>
         <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Search Intensity</label>
               <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700">
                  <option>Normal</option>
                  <option>High (Slower)</option>
                  <option>Extreme (Very Slow)</option>
               </select>
            </div>
            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Conflict Strategy</label>
               <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700">
                  <option>Prioritize Teachers</option>
                  <option>Prioritize Classes</option>
                  <option>Equal Balanced</option>
               </select>
            </div>
            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Model Timeout</label>
               <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700">
                  <option>30 Seconds</option>
                  <option>60 Seconds</option>
                  <option>Unlimited</option>
               </select>
            </div>
         </div>
      </div>
    </div>
  );
}
