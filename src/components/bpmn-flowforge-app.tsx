
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
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
      toast({ 
        title: "መረጃ የለም", 
        description: "እባክዎን የሂደቱን ዝርዝር መግለጫ ያስገቡ።", 
        variant: "destructive" 
      });
      return;
    }
    const result = generateBPMN(input, title || "የሂደት ዲያግራም");
    if (result) {
      setXmlResult(result);
      setActiveTab("diagram");
      toast({ title: "ተሳክቷል", description: "BPMN ዲያግራም በተሳካ ሁኔታ ተፈጥሯል።" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInput(content);
      toast({ title: "ፋይል ተጭኗል", description: "የሂደቱ መግለጫ ተጭኗል።" });
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-white">
      {/* Institutional Top Bar */}
      <div className="h-2 w-full bg-[#1e3a8a]" />
      
      <header className="flex flex-col items-center justify-center py-6 px-8 bg-white border-b border-slate-100 shrink-0 z-10 relative">
        <h1 className="text-xl font-bold text-[#1e3a8a] mb-2" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
          ኢኖቬሽንና ቴክኖሎጂ ልማት ቢሮ
        </h1>
        
        {/* Custom ITDB Circular Logo */}
        <div className="w-12 h-12 bg-[#1e3a8a] rounded-full flex items-center justify-center shadow-sm mb-2">
          <span className="text-white font-bold text-sm tracking-tighter">ITDB</span>
        </div>

        <p className="text-[9px] font-medium italic text-slate-400 uppercase tracking-wider">
          Innovation and Technology Development Bureau
        </p>

        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-slate-400 hover:text-primary">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
              <DropdownMenuItem onClick={() => viewerRef.current?.exportXML()}>
                <FileJson className="w-4 h-4 mr-2 text-primary" /> BPMN (XML) ላክ
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => viewerRef.current?.exportSVG()}>
                <FileType className="w-4 h-4 mr-2 text-primary" /> SVG ላክ
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => document.getElementById('file-upload')?.click()}>
                <Upload className="w-4 h-4 mr-2 text-primary" /> Text/CSV አስገባ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input type="file" id="file-upload" className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
        </div>
      </header>

      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden p-6 gap-6 bg-slate-50/50">
        <div className="w-full lg:w-[380px] flex flex-col gap-4 shrink-0">
          <Card className="flex-1 shadow-sm border border-slate-200 rounded-xl overflow-hidden bg-white">
            <CardContent className="p-6 flex flex-col gap-6 h-full">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">የሂደት መለያ</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="የአገልግሎት/የሂደት ርዕስ ያስገቡ..."
                  className="h-11 rounded-lg bg-slate-50 border-slate-200 focus:ring-primary text-sm"
                  style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                />
              </div>
              <div className="relative flex-1 flex flex-col">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">ቴክኒካዊ መግለጫ</label>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="የስራ ሂደቱን ደረጃዎች እዚህ ይግለጹ..."
                  className="flex-1 resize-none bg-slate-50 border-slate-200 rounded-lg p-4 text-xs font-medium leading-relaxed"
                  style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="absolute bottom-4 right-4 w-4 h-4 text-slate-300 hover:text-primary transition-colors cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] text-[10px] bg-primary text-white p-3 rounded-lg">
                      ንጥረ ነገሮችን ወደ ቀጣዩ ረድፍ ለማስገደድ [wrap] ይጠቀሙ።
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1 h-11 rounded-lg text-slate-500 hover:text-destructive transition-colors" onClick={() => setInput("")}>
                  <Trash2 className="w-4 h-4 mr-2" /> አጥፋ
                </Button>
                <Button className="flex-1 h-11 rounded-lg bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-sm font-semibold shadow-md transition-all active:scale-95 text-white" onClick={handleGenerate}>
                  <Sparkles className="w-4 h-4 mr-2" /> ፍጠር
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm mb-4">
              <div className="flex items-center gap-4">
                <TabsList className="bg-slate-100 h-9 p-1 rounded-lg">
                  <TabsTrigger value="diagram" className="font-semibold text-xs px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Eye className="w-3.5 h-3.5 mr-2" /> ዲያግራም
                  </TabsTrigger>
                  <TabsTrigger value="xml" className="font-semibold text-xs px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Code className="w-3.5 h-3.5 mr-2" /> XML ኮድ
                  </TabsTrigger>
                </TabsList>
                
                {xmlResult && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="h-9 px-4 rounded-lg text-xs font-bold bg-[#1e3a8a] text-white shadow-sm transition-all active:scale-95" 
                    onClick={() => viewerRef.current?.exportPNG()}
                  >
                    <Save className="w-3.5 h-3.5 mr-2" /> PNG አስቀምጥ
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                {xmlResult && (
                  <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => viewerRef.current?.exportXML()}>
                    <Download className="w-3.5 h-3.5 mr-2" /> BPMN አውርድ
                  </Button>
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
                      <span className="font-bold uppercase tracking-widest text-xs opacity-40 block">ምንም ገባሪ ዲያግራም የለም</span>
                      <p className="text-[10px] mt-1 opacity-40">ሞዴሊንግ ለመጀመር ሂደቱን ይግለጹ</p>
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
          <span>ኦፊሴላዊ ተቋማዊ ግንባታ v6.0</span>
          <span className="text-[#1e3a8a]/60">© 2024 የኢኖቬሽንና ቴክኖሎጂ ልማት ቢሮ</span>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> BPMN 2.0 ተገዢ</span>
          <span>የተመሰጠረ ክፍለ ጊዜ ነቅቷል</span>
        </div>
      </footer>
    </div>
  );
}
