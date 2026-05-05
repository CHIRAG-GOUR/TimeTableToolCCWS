"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, CornerLeftUp, CornerRightUp, CornerLeftDown, CornerRightDown, SkipForward } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSidebar } from './Sidebar';

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  waitForEvent?: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const steps: TourStep[] = [
  {
    targetId: 'sidebar-nav',
    title: 'Navigation Hub',
    content: 'First, here are all your tabs. You can navigate through Dashboard, Generator, Teachers, etc.',
    position: 'right'
  },
  {
    targetId: 'tour-upload',
    title: 'Upload Data',
    content: 'Start by pasting your Google Sheet link or Uploading your Excel file here. I\'ll wait until you do it!',
    waitForEvent: 'data-uploaded',
    position: 'bottom'
  },
  {
    targetId: 'tour-generator',
    title: 'Generate Timetable',
    content: 'Once data is loaded, head over to the Generator page to automatically build your perfect, conflict-free timetable.',
    position: 'right'
  },
  {
    targetId: 'tour-data-tabs',
    title: 'Real-time Updates',
    content: 'Need to change a rule? You can update or delete records in these tabs anytime, and the timetable will adjust mathematically without conflicts.',
    position: 'right'
  }
];

export default function OnboardingModal() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();

  useEffect(() => {
    // Check if user has seen it before
    const hasSeen = localStorage.getItem('hasSeenOnboarding');
    if (hasSeen !== 'true' && pathname === '/') {
      // Small delay to let DOM render completely
      const timer = setTimeout(() => setIsActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const updateTargetRect = useCallback(() => {
    if (!isActive || currentStep >= steps.length) return;
    const el = document.getElementById(steps[currentStep].targetId);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      // Element not found on this page, might need to wait or it's hidden
      setTargetRect(null);
    }
  }, [isActive, currentStep]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);
    
    // Poll just in case the element moves dynamically (e.g. sidebar open/close)
    const interval = setInterval(updateTargetRect, 500);

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
      clearInterval(interval);
    };
  }, [updateTargetRect]);

  useEffect(() => {
    if (!isActive || currentStep >= steps.length) return;
    const step = steps[currentStep];
    
    // Auto-open sidebar if target is in sidebar and sidebar is collapsed
    if (['sidebar-nav', 'tour-generator', 'tour-data-tabs'].includes(step.targetId) && isCollapsed) {
      setIsCollapsed(false);
    }

    if (step.waitForEvent) {
      const eventName = step.waitForEvent;
      const handleEvent = () => {
        nextStep();
      };
      window.addEventListener(eventName, handleEvent);
      return () => window.removeEventListener(eventName, handleEvent);
    }
  }, [isActive, currentStep]);

  const endTour = () => {
    setIsActive(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTour();
    }
  };

  if (!isActive) return null;

  const step = steps[currentStep];

  // Calculate popover position
  let popoverStyle: React.CSSProperties = {};
  let arrowDirection = '';
  
  if (targetRect) {
    const PADDING = 20;
    const POPOVER_WIDTH = 380;
    
    if (step.position === 'right') {
      popoverStyle = {
        left: targetRect.right + PADDING,
        top: Math.max(20, targetRect.top + (targetRect.height / 2) - 150)
      };
      arrowDirection = 'left';
    } else if (step.position === 'bottom') {
      popoverStyle = {
        top: targetRect.bottom + PADDING,
        left: Math.max(20, targetRect.left + (targetRect.width / 2) - (POPOVER_WIDTH / 2))
      };
      arrowDirection = 'up';
    } else if (step.position === 'left') {
      popoverStyle = {
        left: targetRect.left - POPOVER_WIDTH - PADDING,
        top: Math.max(20, targetRect.top + (targetRect.height / 2) - 150)
      };
      arrowDirection = 'right';
    } else if (step.position === 'top') {
      popoverStyle = {
        top: targetRect.top - 300 - PADDING,
        left: Math.max(20, targetRect.left + (targetRect.width / 2) - (POPOVER_WIDTH / 2))
      };
      arrowDirection = 'down';
    }
  } else {
    // Center fallback if target not found
    popoverStyle = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    };
  }

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <AnimatePresence>
        {targetRect && (
          <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-auto transition-all duration-300"
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              clipPath: `polygon(
                0% 0%, 
                0% 100%, 
                ${targetRect.left - 8}px 100%, 
                ${targetRect.left - 8}px ${targetRect.top - 8}px, 
                ${targetRect.right + 8}px ${targetRect.top - 8}px, 
                ${targetRect.right + 8}px ${targetRect.bottom + 8}px, 
                ${targetRect.left - 8}px ${targetRect.bottom + 8}px, 
                ${targetRect.left - 8}px 100%, 
                100% 100%, 
                100% 0%
              )`
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {targetRect && (
          <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute rounded-2xl pointer-events-none border-2 border-orange-500 bg-transparent transition-all duration-300"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          >
            {/* Pulsing indicator */}
            <div className="absolute -inset-2 rounded-2xl border-2 border-orange-500 animate-ping opacity-30" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          layout
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          style={popoverStyle}
          className="absolute w-[380px] bg-white rounded-3xl shadow-2xl p-6 pointer-events-auto border border-orange-100 flex flex-col"
        >
          {/* Animated Arrow Pointing to target */}
          {targetRect && arrowDirection === 'left' && (
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-orange-500 animate-bounce" style={{ animationDirection: 'alternate-reverse' }}>
              <ArrowRight className="w-10 h-10 rotate-180 drop-shadow-md" />
            </div>
          )}
          {targetRect && arrowDirection === 'up' && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-orange-500 animate-bounce" style={{ animationDirection: 'alternate-reverse' }}>
              <ArrowRight className="w-10 h-10 -rotate-90 drop-shadow-md" />
            </div>
          )}

          <div className="flex gap-4 items-start mb-4">
            <div className="relative w-16 h-16 rounded-full border-2 border-orange-200 overflow-hidden shrink-0 shadow-md">
              <Image src="/images/chronos-avatar.png" alt="Chronos" fill className="object-cover" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight mb-1">
                {step.title}
              </h3>
              <p className="text-sm text-slate-600 font-medium">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>

          <p className="text-slate-700 leading-relaxed mb-6">
            {step.content}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <button 
              onClick={endTour}
              className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
            >
              Skip Tutorial
            </button>

            {!step.waitForEvent ? (
              <button 
                onClick={nextStep}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 active:scale-95 flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold animate-pulse flex items-center gap-2 border border-slate-200">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                Waiting for Action...
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
