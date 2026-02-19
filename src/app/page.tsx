
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";

/**
 * Institutional Loading Fallback for heavy BPMN/DMS components.
 */
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-12 h-12 text-[#1e3a8a] animate-spin opacity-20" />
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
        ወርቁ (Worqu) - ሲስተሙን በመጫን ላይ...
      </p>
    </div>
  </div>
);

// Dynamically import the main app with SSR disabled to prevent chunk loading issues with bpmn-js
const BPMNFlowForgeApp = dynamic(
  () => import("@/components/bpmn-flowforge-app").then((mod) => mod.BPMNFlowForgeApp),
  { 
    ssr: false,
    loading: () => <LoadingScreen />
  }
);

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Strict client-side mount guard to prevent hydration and chunk-loading mismatches
  if (!mounted) {
    return <LoadingScreen />;
  }

  return (
    <>
      <BPMNFlowForgeApp />
      <Toaster />
    </>
  );
}
