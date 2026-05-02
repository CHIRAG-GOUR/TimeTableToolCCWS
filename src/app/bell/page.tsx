"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Plus, 
  Trash2, 
  GripVertical,
  Save,
  Coffee,
  Utensils,
  BookOpen
} from 'lucide-react';
import { Period, MockData } from '@/data/mockData';

export default function BellSchedule() {
  const [data, setData] = useState<MockData | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setData(json.data);
          setPeriods(json.data.bellSchedule);
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!data) return;
    const updatedData = { ...data, bellSchedule: periods };
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });
    if (res.ok) alert('Bell schedule updated successfully!');
  };

  const addPeriod = () => {
    const newPeriod: Period = {
      id: `p${periods.length + 1}`,
      name: `Period ${periods.length + 1}`,
      startTime: '00:00',
      endTime: '00:00',
      type: 'Class'
    };
    setPeriods([...periods, newPeriod]);
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bell Schedule</h1>
          <p className="mt-2 text-slate-500">Define the global time slots for all classes.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={addPeriod}
            className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Add Period
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Order</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Start Time</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">End Time</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {periods.map((period, index) => (
              <tr key={period.id} className="group hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-slate-400 cursor-grab" />
                    <span className="text-sm text-slate-600">{index + 1}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="text" 
                    value={period.name}
                    onChange={(e) => {
                      const newPeriods = [...periods];
                      newPeriods[index].name = e.target.value;
                      setPeriods(newPeriods);
                    }}
                    className="bg-transparent border-none text-slate-900 text-sm font-bold focus:ring-0 w-full"
                  />
                </td>
                <td className="px-6 py-4">
                  <select 
                    value={period.type}
                    onChange={(e) => {
                      const newPeriods = [...periods];
                      newPeriods[index].type = e.target.value as any;
                      setPeriods(newPeriods);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-bold focus:ring-orange-500 px-3 py-1.5"
                  >
                    <option value="Class">Class</option>
                    <option value="Break">Break</option>
                    <option value="Lunch">Lunch</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm">
                  <input 
                    type="time" 
                    value={period.startTime}
                    onChange={(e) => {
                      const newPeriods = [...periods];
                      newPeriods[index].startTime = e.target.value;
                      setPeriods(newPeriods);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium px-3 py-1.5"
                  />
                </td>
                <td className="px-6 py-4 text-sm">
                  <input 
                    type="time" 
                    value={period.endTime}
                    onChange={(e) => {
                      const newPeriods = [...periods];
                      newPeriods[index].endTime = e.target.value;
                      setPeriods(newPeriods);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium px-3 py-1.5"
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setPeriods(periods.filter(p => p.id !== period.id))}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {periods.length === 0 && (
          <div className="py-20 text-center">
            <Clock className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500">No periods defined. Add one to get started.</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="premium-card p-6 bg-orange-50 border-orange-100">
          <BookOpen className="h-6 w-6 text-orange-600 mb-4" />
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Concept</h3>
          <p className="text-xs text-slate-500">Timetable slots are mapped to these period IDs, not actual times. Updating these times reflects globally.</p>
        </div>
        <div className="premium-card p-6 bg-amber-50 border-amber-100">
          <Coffee className="h-6 w-6 text-amber-600 mb-4" />
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Breaks</h3>
          <p className="text-xs text-slate-500">Break periods are automatically greyed out in the timetable grids across all classes.</p>
        </div>
        <div className="premium-card p-6 bg-purple-50 border-purple-100">
          <Utensils className="h-6 w-6 text-purple-600 mb-4" />
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Lunch</h3>
          <p className="text-xs text-slate-500">Standardizing lunch blocks helps the generator avoid scheduling subjects during this window.</p>
        </div>
      </div>
    </div>
  );
}
