import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chronos | Smart Time-Table Generator",
  description: "Generate optimized school schedules using advanced AI technology.",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased selection:bg-orange-500/30 transition-colors duration-300`}>
        <div className="relative flex min-h-full overflow-hidden">
          {/* Background Gradient */}
          <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent opacity-30" />
          <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-500/5 via-transparent to-transparent opacity-30" />
          
          <Sidebar />
          
          <div className="flex flex-1 flex-col pl-64">
            <Navbar />
            <main className="relative flex-1 p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}


