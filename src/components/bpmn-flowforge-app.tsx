"use client";

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Copy, FileCode, Play, Trash2, CheckCircle2, Info, Eye, Code, Download, FileJson, Share2 } from "lucide-react";
import { generateBPMN } from "@/lib/bpmn-engine";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BPMNViewer, type BPMNViewerRef } from "@/components/bpmn-viewer";

export function BPMNFlowForgeApp() {
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("Service 21: e-Government Process");
  const [xmlResult, setXmlResult] = useState("");
  const [activeTab, setActiveTab] = useState("diagram");
  const viewerRef = useRef<BPMNViewerRef>(null);
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!input.trim()) {
      toast({
        title: "No steps provided",
        description: "Please enter process steps to generate your diagram.",
        variant: "destructive",
      });
      return;
    }
    const result = generateBPMN(input, title);
    if (result) {
      setXmlResult(result);
      setActiveTab("diagram");
      toast({
        title: "Architecture Generated",
        description: "Your BPMN 2.0 diagram is ready.",
      });
    } else {
      toast({
        title: "Generation Error",
        description: "Could not parse process logic. Please check your steps.",
        variant: "destructive",
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlResult);
    toast({
      title: "Copied!",
      description: "BPMN XML has been copied to your clipboard.",
    });
  };

  const handleDownloadXML = () => {
    const blob = new Blob(["\uFEFF", xmlResult], { type: "application/bpmn20-xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.bpmn`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloading BPMN...",
      description: "Compatible with Camunda Modeler and Desktop modeling tools.",
    });
  };

  const handleDownloadPNG = async () => {
    if (viewerRef.current) {
      await viewerRef.current.exportPNG();
      toast({
        title: "Exporting PNG...",
        description: "High-contrast professional output generated.",
      });
    }
  };

  const handleClear = () => {
    setInput("");
    setXmlResult("");
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-primary text-primary-foreground shadow-xl shrink-0 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-inner">
            <FileCode className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase">(ወርቁ) Pro</h1>
            <p className="text-[10px] opacity-70 font-medium tracking-widest uppercase">BPMN Architect</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="px-3 py-1 bg-accent text-primary border-none font-bold animate-pulse">
            Camunda 2.0 Ready
          </Badge>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden p-6 gap-6">
        {/* Left Side: Input */}
        <div className="w-full lg:w-[420px] flex flex-col gap-4 shrink-0 overflow-y-auto lg:overflow-visible">
          <Card className="flex flex-col shadow-2xl border-none bg-card h-full lg:h-auto lg:flex-1 rounded-2xl overflow-hidden">
            <CardHeader className="shrink-0 bg-muted/30 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                Process Definition
              </CardTitle>
              <CardDescription className="text-xs">
                Describe your digitalization service steps below.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 p-5">
              <div className="space-y-2">
                <Label htmlFor="service-title" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  የአገልግሎት ስም ያስገቡ
                </Label>
                <Input
                  id="service-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Service 21: e-Government"
                  className="bg-muted/50 border-muted focus:ring-primary h-11 rounded-xl font-medium"
                />
              </div>

              <div className="relative flex-1 min-h-[250px] lg:min-h-0">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">
                  Workflow Logic (Tasks & Flow)
                </Label>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={"Describe the flow...\nExample:\nReceive digital request (service)\nParallel\nVerify documents (user)\nNotify user (service)\nProcess application (service)\nIs data valid? (gateway)\nUpdate records (service)\nFix application (edit)"}
                  className="w-full h-[calc(100%-24px)] resize-none font-body text-sm border-muted focus:ring-primary focus:border-primary p-4 rounded-xl shadow-inner bg-slate-50"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={handleClear}
                  className="flex items-center gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-muted rounded-xl h-12"
                >
                  <Trash2 className="w-4 h-4" /> Reset
                </Button>
                <Button 
                  onClick={handleGenerate}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12 rounded-xl text-base font-bold shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" /> Generate Architect
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 hidden sm:flex items-start gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Share2 className="w-5 h-5 text-primary shrink-0" />
            </div>
            <div className="text-[11px] text-primary/80 leading-relaxed">
              <p className="font-bold mb-1 uppercase tracking-wider text-primary">Architecture Rules:</p>
              <ul className="space-y-1 opacity-90">
                <li>• <strong>Service Task:</strong> Use "send", "notify", "update".</li>
                <li>• <strong>User Task:</strong> Use "review", "approve", "verify".</li>
                <li>• <strong>Parallelism:</strong> Use "parallel" or "simultaneously".</li>
                <li>• <strong>Loop:</strong> Use "edit" or "fix" for return arrows.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side: Output */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <TabsList className="bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="diagram" className="flex items-center gap-2 rounded-lg px-4 font-bold">
                  <Eye className="w-4 h-4" /> <span className="hidden xs:inline">Live Canvas</span>
                </TabsTrigger>
                <TabsTrigger value="xml" className="flex items-center gap-2 rounded-lg px-4 font-bold">
                  <Code className="w-4 h-4" /> <span className="hidden xs:inline">BPMN 2.0 Source</span>
                </TabsTrigger>
              </TabsList>
              
              {xmlResult && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={handleDownloadXML}
                    className="flex items-center gap-2 font-bold shadow-sm rounded-lg"
                  >
                    <FileJson className="w-4 h-4" /> <span className="hidden sm:inline">XML Export</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDownloadPNG}
                    className="flex items-center gap-2 font-bold rounded-lg"
                  >
                    <Download className="w-4 h-4" /> <span className="hidden sm:inline">PNG</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleCopy}
                    className="h-9 w-9 p-0"
                    title="Copy XML"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <Card className="flex-1 flex flex-col shadow-2xl border-none bg-white rounded-3xl overflow-hidden min-h-0 ring-1 ring-slate-200">
              <TabsContent value="diagram" className="flex-1 m-0 focus-visible:ring-0 h-full">
                {xmlResult ? (
                  <div className="h-full w-full">
                    <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
                  </div>
                ) : (
                  <EmptyState message="Your professional BPMN diagram will be rendered here." />
                )}
              </TabsContent>
              
              <TabsContent value="xml" className="flex-1 m-0 focus-visible:ring-0 h-full">
                {xmlResult ? (
                  <ScrollArea className="h-full w-full bg-slate-900">
                    <pre className="p-8 font-code text-xs leading-relaxed text-blue-300 overflow-x-auto selection:bg-blue-500/30">
                      <code>{xmlResult}</code>
                    </pre>
                  </ScrollArea>
                ) : (
                  <EmptyState message="XML source code for Camunda Modeler will appear here." />
                )}
              </TabsContent>
            </Card>
          </Tabs>
          
          {xmlResult && (
            <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-xs text-emerald-800 font-bold tracking-tight">
                  Diagram validated for Service 21 Implementation.
                </p>
              </div>
              <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600 font-black">STABLE v5.0</Badge>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="px-8 py-3 bg-white border-t border-muted hidden sm:flex items-center justify-between text-[10px] text-muted-foreground shrink-0 uppercase tracking-widest font-bold">
        <p>© {new Date().getFullYear()} (ወርቁ) - Senior BPMN Architect Edition</p>
        <p className="flex items-center gap-6">
          <span className="text-primary">APK Optimized</span>
          <span>Lenovo Laptop Ready</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">Service 21 Context</span>
        </p>
      </footer>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground/50">
      <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <FileCode className="w-10 h-10 opacity-10" />
      </div>
      <p className="text-sm font-bold max-w-[280px] leading-relaxed italic uppercase tracking-wider">
        {message}
      </p>
    </div>
  );
}
