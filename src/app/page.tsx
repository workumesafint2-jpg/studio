'use client';

import dynamic from 'next/dynamic';
import { Toaster } from "@/components/ui/toaster";

// Dynamically import the main app with SSR disabled to prevent chunk loading issues with bpmn-js
const BPMNFlowForgeApp = dynamic(
  () => import("@/components/bpmn-flowforge-app").then((mod) => mod.BPMNFlowForgeApp),
  { ssr: false }
);

export default function Home() {
  return (
    <>
      <BPMNFlowForgeApp />
      <Toaster />
    </>
  );
}
