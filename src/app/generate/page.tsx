"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Settings,
  Cpu,
  BarChart3,
  ArrowRight
} from 'lucide-react';

export default function GeneratorPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const startGeneration = async () => {
    setStatus('generating');
    try {
      const res = await fetch('/api/generate', { method: 'POST' });
      const json = await res.json();
      
      if (json.success) {
        setStatus('success');
        setMessage(json.message);
        
        // Auto-redirect after 2 seconds
        setTimeout(() => {
          router.push('/timetable');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(json.message || 'Generation failed.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('A network error occurred.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-10 animate-in">
      <div className="text-center space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 mb-2">
          <Zap className="h-8 w-8 text-orange-600" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">AI Timetable Generator</h1>
        <p className="text-slate-500 max-w-lg mx-auto">
          Our advanced CP-SAT solver will analyze thousands of possibilities to find the most efficient schedule for your school.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="premium-card p-8 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-600" />
            Generation Parameters
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Optimization Goal</span>
                <span className="text-xs font-bold text-orange-600 uppercase">Balanced</span>
              </div>
              <p className="text-xs text-slate-500">Minimizes teacher gaps and ensures even subject distribution.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Hard Constraints</span>
                <span className="text-xs font-bold text-orange-600 uppercase">Active</span>
              </div>
              <p className="text-xs text-slate-500">Teacher uniqueness and class exclusivity are strictly enforced.</p>
            </div>
          </div>

          <button 
            onClick={startGeneration}
            disabled={status === 'generating'}
            className="w-full py-4 rounded-2xl bg-orange-600 text-white font-bold text-lg shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {status === 'generating' ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="h-6 w-6 fill-current" />
                Generate Schedule
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="premium-card p-6 flex-1 flex flex-col justify-center items-center text-center">
            <AnimatePresence mode="wait">
              {status === 'idle' && (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <BarChart3 className="h-12 w-12 text-slate-200 mx-auto" />
                  <p className="text-slate-400 text-sm italic">System ready to generate.</p>
                </motion.div>
              )}

              {status === 'generating' && (
                <motion.div 
                  key="generating"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-6 w-full"
                >
                  <div className="relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="absolute h-full bg-orange-600"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-orange-600 text-sm font-bold">SOLVING MODEL</p>
                    <p className="text-slate-400 text-xs">Exploring search space...</p>
                  </div>
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div 
                  key="success"
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="h-16 w-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-10 w-10 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-bold">Success!</h3>
                    <p className="text-slate-500 text-sm mt-1">{message}</p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-orange-600 text-xs font-bold animate-pulse">
                      <span>Redirecting to Timetables</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div 
                  key="error"
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="h-10 w-10 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-bold">Infeasible</h3>
                    <p className="text-slate-500 text-sm mt-1">{message}</p>
                  </div>
                  <button onClick={() => setStatus('idle')} className="text-slate-400 text-xs hover:text-slate-900 underline">
                    Try Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="premium-card p-6 bg-slate-50/50">
             <div className="flex items-center gap-3 mb-4">
               <Cpu className="h-5 w-5 text-orange-600" />
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Engine Status</h3>
             </div>
             <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Solver</span>
                  <span className="text-slate-700 font-medium">CP-SAT v1.0.0</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Precision</span>
                  <span className="text-slate-700 font-medium">High (Feasible/Optimal)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Worker</span>
                  <span className="text-orange-600 font-bold">IDLE</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

