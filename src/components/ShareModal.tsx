"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Image as ImageIcon, 
  FileText, 
  FileSpreadsheet, 
  Share2, 
  Link as LinkIcon,
  Download,
  Smartphone
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'image' | 'pdf' | 'excel') => void;
  onShareLink: () => void;
  className: string;
}

export default function ShareModal({ isOpen, onClose, onExport, onShareLink, className }: ShareModalProps) {
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleNativeShare = async (format: 'image' | 'pdf' | 'excel') => {
    // For now, we trigger export. In a real mobile app, we might use Web Share API with a Blob.
    // Web Share API support for files is limited, so we'll primarily trigger download which mobile browsers handle well.
    onExport(format);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
          >
            {/* Decoration */}
            <div className="absolute top-0 right-0 p-12 -mr-16 -mt-16 bg-orange-500/10 rounded-full blur-3xl" />
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Share Timetable</h3>
                <p className="text-sm text-slate-500">Choose your preferred format for {className}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <button 
                onClick={() => onExport('image')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ImageIcon className="h-6 w-6 text-orange-600" />
                </div>
                <span className="text-sm font-bold text-slate-700">Image (PNG)</span>
              </button>

              <button 
                onClick={() => onExport('pdf')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
                <span className="text-sm font-bold text-slate-700">Document (PDF)</span>
              </button>

              <button 
                onClick={() => onExport('excel')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="text-sm font-bold text-slate-700">Excel Sheet</span>
              </button>

              <button 
                onClick={onShareLink}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/5 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LinkIcon className="h-6 w-6 text-amber-600" />
                </div>
                <span className="text-sm font-bold text-slate-700">Copy Link</span>
              </button>
            </div>

            {isMobile && (
              <div className="p-4 rounded-2xl bg-orange-600 flex items-center gap-4 text-white cursor-pointer hover:bg-orange-500 transition-colors" onClick={() => onShareLink()}>
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">Quick Share</p>
                  <p className="text-[10px] text-white/70 font-medium">Use mobile system share</p>
                </div>
                <Share2 className="h-5 w-5" />
              </div>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Professional Export • Academic Year 2026-27
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
