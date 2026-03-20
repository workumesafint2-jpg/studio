'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";
import { AuthGuard } from '@/components/auth-guard';

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

/**
 * Enhanced Dynamic Loader with Chunk Recovery Logic.
 */
const BPMNFlowForgeApp = dynamic(
  () => import("@/components/bpmn-flowforge-app").then((mod) => mod.BPMNFlowForgeApp).catch((err) => {
    console.error("Chunk load failed, attempting reload...", err);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    return () => <LoadingScreen />;
  }),
  { 
    ssr: false,
    loading: () => <LoadingScreen />
  }
);

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const handleChunkError = (e: ErrorEvent) => {
      if (e.message.includes('Loading chunk') || e.message.includes('CSS chunk')) {
        window.location.reload();
      }
    };

    window.addEventListener('error', handleChunkError);
    return () => window.removeEventListener('error', handleChunkError);
  }, []);

  if (!isClient) {
    return <LoadingScreen />;
  }

  return (
    <AuthGuard>
      <Suspense fallback={<LoadingScreen />}>
        <BPMNFlowForgeApp />
        <Toaster />
      </Suspense>
    </AuthGuard>
  );
}
