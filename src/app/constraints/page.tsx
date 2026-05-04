"use client";

import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Users, 
  Layers, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Info,
  ScrollText
} from 'lucide-react';
import { MockData, HardConstraint } from '@/data/mockData';

export default function ConstraintsPage() {
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

  const toggleConstraint = (id: string) => {
    if (!data) return;
    // Logic to toggle constraint state if we add an 'active' field to HardConstraint
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Solver Constraints</h1>
          <p className="mt-2 text-slate-500">Rules recognized from your Hard Constraints tab.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
           <ShieldCheck className="h-4 w-4" />
           <span className="text-sm font-bold uppercase tracking-wider">Engine: Ready</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {data?.hardConstraints.map((c) => (
          <div key={c.id} className="premium-card p-6 space-y-4 border-l-4 border-l-orange-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <ScrollText className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="font-bold text-slate-900">Constraint Rule</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {c.rule}
            </p>
          </div>
        ))}

        {(!data?.hardConstraints || data.hardConstraints.length === 0) && (
          <div className="col-span-2 py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No constraints recognized yet. Sync your sheet to see the rules here.</p>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-900 rounded-2xl text-white space-y-4 overflow-hidden relative">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck className="h-32 w-32" />
         </div>
         <h2 className="text-lg font-bold">Solver Logic Status</h2>
         <p className="text-sm text-slate-400 max-w-xl">
            The Chronos engine is currently set to follow the 14 hard constraints detected in your sheet. 
            Any generation will strictly adhere to these rules before producing a result.
         </p>
         <div className="flex gap-4 pt-2">
            <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase">Strict Enforcement</div>
            <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase">Tab: Hard_Constraints</div>
         </div>
      </div>
    </div>
  );
}
