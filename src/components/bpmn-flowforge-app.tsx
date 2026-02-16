
"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileCode, 
  Trash2, 
  MoreVertical, 
  Eye, 
  Code, 
  Download, 
  Sparkles, 
  FileType, 
  Save, 
  Upload, 
  Info, 
  FileJson,
  Layout
} from "lucide-react";
import { generateBPMN } from "@/lib/bpmn-engine";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BPMNViewer, type BPMNViewerRef } from "@/components/bpmn-viewer";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function BPMNFlowForgeApp() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [xmlResult, setXmlResult] = useState("");
  const [activeTab, setActiveTab] = useState("diagram");
  const viewerRef = useRef<BPMNViewerRef>(null);
  const { toast } = useToast();

  const itdbLogo = PlaceHolderImages.find(img => img.id === 'itdb-logo');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleGenerate = () => {
    if (!input.trim()) {
      toast({ 
        title: "No Data", 
        description: "Please enter the process description.", 
        variant: "destructive" 
      });
      return;
    }
    const result = generateBPMN(input, title || "Process Diagram");
    if (result) {
      setXmlResult(result);
      setActiveTab("diagram");
      toast({ title: "Success", description: "BPMN Diagram generated successfully." });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInput(content);
      toast({ title: "File Uploaded", description: "Process description loaded." });
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-slate-50">
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shadow-sm shrink-0 z-10">
        <div className="flex items-center gap-4">
          {itdbLogo && (
            <div className="relative w-12 h-12 overflow-hidden rounded-full border border-slate-100 shadow-sm">
              <Image 
                src={itdbLogo.imageUrl} 
                alt="ITDB Logo" 
                fill 
                className="object-cover"
                data-ai-hint="bureau logo"
              />
            </div>
          )}
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <h1 className="text-xl font-bold text-primary tracking-tight uppercase">
            Innovation and Technology Development Bureau
          </h1>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] mt-0.5">
            Process Design & Standardization Portal
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
              <DropdownMenuItem onClick={() => viewerRef.current?.exportXML()}>
                <FileJson className="w-4 h-4 mr-2 text-primary" /> Export BPMN (XML)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => viewerRef.current?.exportSVG()}>
                <FileType className="w-4 h-4 mr-2 text-primary" /> Export SVG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => document.getElementById('file-upload')?.click()}>
                <Upload className="w-4 h-4 mr-2 text-primary" /> Import Text/CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input type="file" id="file-upload" className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
        </div>
      </header>

      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden p-6 gap-6">
        <div className="w-full lg:w-[380px] flex flex-col gap-4 shrink-0">
          <Card className="flex-1 shadow-sm border border-slate-200 rounded-xl overflow-hidden bg-white">
            <CardContent className="p-6 flex flex-col gap-6 h-full">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Process Identification</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter Service/Process Title..."
                  className="h-11 rounded-lg bg-slate-50 border-slate-200 focus:ring-primary text-sm"
                />
              </div>
              <div className="relative flex-1 flex flex-col">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Technical Description</label>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe the workflow steps here. Use [wrap] for row breaks..."
                  className="flex-1 resize-none bg-slate-50 border-slate-200 rounded-lg p-4 text-xs font-medium leading-relaxed"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="absolute bottom-4 right-4 w-4 h-4 text-slate-300 hover:text-primary transition-colors cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] text-[10px] bg-primary text-white p-3 rounded-lg">
                      Use the [wrap] keyword to manually force elements to the next row in complex processes.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1 h-11 rounded-lg text-slate-500 hover:text-destructive transition-colors" onClick={() => setInput("")}>
                  <Trash2 className="w-4 h-4 mr-2" /> Reset
                </Button>
                <Button className="flex-1 h-11 rounded-lg bg-primary hover:bg-primary/90 text-sm font-semibold shadow-md transition-all active:scale-95" onClick={handleGenerate}>
                  <Sparkles className="w-4 h-4 mr-2" /> Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm mb-4">
              <TabsList className="bg-slate-100 h-9 p-1 rounded-lg">
                <TabsTrigger value="diagram" className="font-semibold text-xs px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Eye className="w-3.5 h-3.5 mr-2" /> Diagram
                </TabsTrigger>
                <TabsTrigger value="xml" className="font-semibold text-xs px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Code className="w-3.5 h-3.5 mr-2" /> XML Code
                </TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                {xmlResult && (
                  <>
                    <Button variant="default" size="sm" className="h-9 px-4 rounded-lg text-xs font-bold shadow-sm" onClick={() => viewerRef.current?.exportPNG()}>
                      <Save className="w-3.5 h-3.5 mr-2" /> Save PNG (High-Res)
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg text-xs font-bold border-slate-200" onClick={() => viewerRef.current?.exportXML()}>
                      <Download className="w-3.5 h-3.5 mr-2" /> Download BPMN
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-0 relative">
              <TabsContent value="diagram" className="h-full m-0 p-0 focus-visible:ring-0">
                {xmlResult ? (
                  <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                    <div className="p-10 border-2 border-dashed border-slate-100 rounded-full bg-slate-50/50">
                      <Layout className="w-12 h-12 opacity-20" />
                    </div>
                    <div className="text-center">
                      <span className="font-bold uppercase tracking-widest text-xs opacity-40 block">No Active Diagram</span>
                      <p className="text-[10px] mt-1 opacity-40">Describe a process to start modeling</p>
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="xml" className="h-full m-0 focus-visible:ring-0">
                <ScrollArea className="h-full bg-slate-900">
                  <pre className="p-8 text-[11px] text-blue-300 font-mono leading-relaxed">
                    <code>{xmlResult}</code>
                  </pre>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
      
      <footer className="px-8 py-3 bg-white border-t border-slate-200 flex justify-between items-center text-[9px] font-bold uppercase text-slate-400 tracking-wider">
        <div className="flex gap-6">
          <span>Official Institutional Build v5.2</span>
          <span className="text-primary/60">© 2024 Innovation and Technology Development Bureau</span>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> BPMN 2.0 Compliant</span>
          <span>Encrypted Session Enabled</span>
        </div>
      </footer>
    </div>
  );
}
