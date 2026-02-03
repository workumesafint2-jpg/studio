import { BPMNFlowForgeApp } from "@/components/bpmn-flowforge-app";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  return (
    <>
      <BPMNFlowForgeApp />
      <Toaster />
    </>
  );
}