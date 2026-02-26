
'use client';

import React, { useState, useEffect, Suspense } from 'react';
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

/**
 * Enhanced Dynamic Loader with Chunk Recovery Logic.
 * Resolves ChunkLoadError by attempting a retry and falling back to a page reload if necessary.
 */
const BPMNFlowForgeApp = dynamic(
  () => {
    const loadComponent = () => import("@/components/bpmn-flowforge-app").then((mod) => mod.BPMNFlowForgeApp);
    
    return loadComponent().catch((err) => {
      console.warn("Institutional Sync: Chunk loading failed. Attempting recovery...", err);
      
      // Retry after 1.5 seconds
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          loadComponent()
            .then(resolve)
            .catch((retryErr) => {
              console.error("Institutional Sync: Recovery failed. Reloading portal...", retryErr);
              // Force reload to get fresh chunks if retry fails
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
              reject(retryErr);
            });
        }, 1500);
      });
    }) as any;
  },
  { 
    ssr: false,
    loading: () => <LoadingScreen />
  }
);

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Ensuring the component is only rendered on the client to avoid hydration mismatches
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <BPMNFlowForgeApp />
      <Toaster />
    </Suspense>
  );
}
