
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FileCode, Trash2, MoreVertical, Eye, Code, Download, Sparkles, FileType, Save, Upload, Info, FileJson } from "lucide-react";
import { generateBPMN } from "@/lib/bpmn-engine";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BPMNViewer, type BPMNViewerRef } from "@/components/bpmn-viewer";
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleGenerate = () => {
    if (!input.trim()) {
      toast({ title: "ምንም ዳታ የለም", description: "እባክዎን የሂደቱን ዝርዝር ያስገቡ።", variant: "destructive" });
      return;
    }
    const result = generateBPMN(input, title || "Process Diagram");
    if (result) {
      setXmlResult(result);
      setActiveTab("diagram");
      toast({ title: "ተሳክቷል", description: "BPMN ዲያግራም ተፈጥሯል።" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInput(content);
      toast({ title: "ፋይል ገብቷል", description: "የአገልግሎቱ ዝርዝር ተጭኗል።" });
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-background">
      <header className="flex items-center justify-between px-6 py-3 bg-primary text-primary-foreground shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white rounded-lg">
            <FileCode className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-lg font-black tracking-tighter uppercase">(ወርቁ) PRO - STABLE RECOVERY BUILD</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="bg-white text-primary font-bold h-9 rounded-lg shadow-md" onClick={() => viewerRef.current?.exportPNG()}>
            <Save className="w-4 h-4 mr-2" /> Save PNG (High-Res)
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary-foreground rounded-full hover:bg-white/20">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
              <DropdownMenuItem onClick={() => viewerRef.current?.exportXML()}>
                <FileJson className="w-4 h-4 mr-2" /> Export BPMN (XML)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => viewerRef.current?.exportSVG()}>
                <FileType className="w-4 h-4 mr-2" /> Export SVG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => document.getElementById('file-upload')?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Import Text/CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input type="file" id="file-upload" className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
        </div>
      </header>

      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden p-4 gap-4">
        <div className="w-full lg:w-[400px] flex flex-col gap-3 shrink-0">
          <Card className="flex-1 shadow-xl border-none rounded-2xl overflow-hidden ring-1 ring-slate-100 bg-white">
            <CardContent className="p-6 flex flex-col gap-4 h-full">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Process Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="የአገልግሎቱ ስም..."
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:ring-primary"
                />
              </div>
              <div className="relative flex-1 flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Process Description</label>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="የሂደቱን ዝርዝር እዚህ ይጻፉ... [wrap] በመጠቀም ወደ ታች መውረድ ይችላሉ።"
                  className="flex-1 resize-none bg-slate-50 border-slate-200 rounded-xl p-4 text-xs font-semibold leading-relaxed"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="absolute bottom-4 right-4 w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] text-[10px]">
                      Use [wrap] keyword to manually break steps into the next row.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-12 rounded-xl border-2" onClick={() => setInput("")}>
                  <Trash2 className="w-4 h-4 mr-2" /> አጽዳ
                </Button>
                <Button className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-lg font-bold shadow-xl transition-all active:scale-95" onClick={handleGenerate}>
                  <Sparkles className="w-4 h-4 mr-2" /> አመንጭ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <TabsList className="bg-slate-100 h-10 p-1 rounded-xl">
                <TabsTrigger value="diagram" className="font-bold text-xs px-4"><Eye className="w-4 h-4 mr-2" /> ዲያግራም</TabsTrigger>
                <TabsTrigger value="xml" className="font-bold text-xs px-4"><Code className="w-4 h-4 mr-2" /> ኮድ</TabsTrigger>
              </TabsList>
              {xmlResult && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 rounded-lg text-[10px] font-bold bg-white" onClick={() => viewerRef.current?.exportPNG()}>
                    <Download className="w-3.5 h-3.5 mr-1" /> PNG
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 rounded-lg text-[10px] font-bold bg-white" onClick={() => viewerRef.current?.exportXML()}>
                    <FileType className="w-3.5 h-3.5 mr-1" /> BPMN
                  </Button>
                </div>
              )}
            </div>
            <div className="flex-1 bg-white rounded-2xl shadow-inner border border-slate-200 overflow-hidden min-h-0 relative">
              <TabsContent value="diagram" className="h-full m-0 p-0 focus-visible:ring-0">
                {xmlResult ? (
                  <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                    <div className="p-8 border-4 border-dashed border-slate-100 rounded-full">
                      <FileCode className="w-16 h-16 opacity-20" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-sm italic opacity-40">ምንም ዲያግራም የለም</span>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="xml" className="h-full m-0 focus-visible:ring-0">
                <ScrollArea className="h-full bg-slate-900">
                  <pre className="p-6 text-[10px] text-blue-300 font-mono leading-relaxed">
                    <code>{xmlResult}</code>
                  </pre>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
      
      <footer className="px-6 py-2 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-tighter">
        <span>(ወርቁ) PRO V5.0 - PRODUCTION STABLE</span>
        <div className="flex gap-4">
          <span className="text-primary font-bold">BPMN 2.0 COMPLIANT</span>
          <span>PERSISTENT APK STORAGE ENABLED</span>
        </div>
      </footer>
    </div>
  );
}
