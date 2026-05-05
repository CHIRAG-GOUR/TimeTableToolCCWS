"use client";

import React, { useState } from 'react';
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar, { SidebarContext } from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import OnboardingModal from "@/components/OnboardingModal";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <html lang="en" className="h-full">
      <head>
        <title>Chronos | Smart Time-Table Generator</title>
        <meta name="description" content="Generate optimized school schedules using advanced AI technology." />
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className={`${inter.className} h-full antialiased selection:bg-orange-500/30 transition-colors duration-300`}>
        <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
          <div className="relative flex min-h-full overflow-hidden">
            <OnboardingModal />
            {/* Background Gradient */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent opacity-30" />
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-500/5 via-transparent to-transparent opacity-30" />
            
            <Sidebar />
            
            {/* Main content: full width when sidebar collapsed */}
            <div className="flex flex-1 flex-col w-full transition-all duration-300">
              <Navbar />
              <main className="relative flex-1 px-4 py-6 sm:px-6 lg:px-8">
                {children}
              </main>
            </div>
          </div>
        </SidebarContext.Provider>
      </body>
    </html>
  );
}
