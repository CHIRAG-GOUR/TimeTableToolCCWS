"use client";

import React, { useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Bell, 
  Users, 
  BookOpen, 
  School, 
  Settings2, 
  Zap,
  CalendarDays,
  User,
  Menu,
  X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sidebar context so layout can react to collapse state
export const SidebarContext = createContext<{
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}>({ isCollapsed: true, setIsCollapsed: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Bell Schedule', icon: Bell, href: '/bell' },
  { name: 'Teachers', icon: Users, href: '/teachers' },
  { name: 'Subjects', icon: BookOpen, href: '/subjects' },
  { name: 'Classes', icon: School, href: '/classes' },
  { name: 'Constraints', icon: Settings2, href: '/constraints' },
  { name: 'Generator', icon: Zap, href: '/generate' },
  { name: 'Timetables', icon: CalendarDays, href: '/timetable' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();

  return (
    <>
      {/* Hamburger toggle – always visible */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all print:hidden"
        aria-label="Toggle sidebar"
      >
        {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
      </button>

      {/* Overlay when open on mobile */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCollapsed(true)}
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden print:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-orange-900/10 bg-gradient-to-b from-orange-700 to-orange-800 text-white transition-all duration-300 print:hidden",
          isCollapsed ? "-translate-x-full" : "translate-x-0 w-64"
        )}
      >
        <div className="flex h-full flex-col px-3 py-4">
          {/* Logo */}
          <div className="mb-10 flex items-center px-4 pt-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold tracking-tight text-white">Chronos</span>
          </div>
          
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsCollapsed(true)}
                  className={cn(
                    "group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-white/20 text-white backdrop-blur-md shadow-sm border border-white/10" 
                      : "text-orange-100 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className={cn(
                    "mr-3 h-5 w-5 transition-colors duration-200",
                    isActive ? "text-white" : "text-orange-200 group-hover:text-white"
                  )} />
                  {item.name}
                  {isActive && (
                    <motion.div layoutId="sidebar-active" className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-white/5 pt-4 px-2">
            <div className="flex items-center rounded-2xl bg-white/5 p-3 border border-white/5">
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center shadow-inner border border-white/10">
                 <User className="h-5 w-5 text-white/80" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-semibold text-white/90">Admin User</p>
                <p className="text-[10px] text-orange-200/70">Principal&apos;s Office</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
