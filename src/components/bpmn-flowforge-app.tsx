"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FileCode, Trash2, MoreVertical, FolderArchive, Eye, Code, Download, FileJson, Sparkles, Copy, FileType } from "lucide-react";
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
import JSZip from 'jszip';

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

  if (!mounted) {
    return <div className="flex h-screen w-screen bg-background items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <FileCode className="w-12 h-12 text-primary/20" />
        <div className="h-4 w-32 bg-muted rounded"></div>
      </div>
    </div>;
  }

  const handleGenerate = () => {
    if (!input.trim()) {
      toast({
        title: "ምንም ዳታ የለም",
        description: "እባክዎን የሂደቱን ዝርዝር ያስገቡ።",
        variant: "destructive",
      });
      return;
    }
    const result = generateBPMN(input, title || "Process Diagram");
    if (result) {
      setXmlResult(result);
      setActiveTab("diagram");
      toast({
        title: "ዲያግራሙ ተዘጋጅቷል",
        description: "የእርስዎ BPMN 2.0 ዲያግራም ዝግጁ ነው።",
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlResult);
    toast({
      title: "ተገልብጧል!",
      description: "BPMN XML ወደ ቅንጥብ ሰሌዳዎ ተገልብጧል።",
    });
  };

  const handleDownloadXML = () => {
    const fileName = (title || "process-diagram").replace(/\s+/g, '-').toLowerCase();
    const blob = new Blob(["\uFEFF", xmlResult], { type: "application/bpmn20-xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.bpmn`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = async () => {
    if (viewerRef.current) {
      await viewerRef.current.exportPNG();
    }
  };

  const handleDownloadSVG = async () => {
    if (viewerRef.current) {
      await viewerRef.current.exportSVG();
    }
  };

  const handleDownloadProject = async () => {
    const zip = new JSZip();
    const fileName = (title || "process-diagram").replace(/\s+/g, '-').toLowerCase();
    
    zip.file(`${fileName}.bpmn`, xmlResult || "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\" targetNamespace=\"http://bpmn.io/schema/bpmn\"></bpmn:definitions>");
    
    const readmeContent = `# ${title || 'BPMN ፕሮጀክት'}\n\nበ(ወርቁ) Pro የተሰራ።`;
    zip.file("README.md", readmeContent);

    try {
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}-project.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {}
  };

  const handleClear = () => {
    setInput("");
    setTitle("");
    setXmlResult("");
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-background">
      <header className="flex items-center justify-between px-6 py-3 bg-primary text-primary-foreground shadow-lg shrink-0 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white rounded-lg shadow-inner">
            <FileCode className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase">(ወርቁ) PRO</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={handleDownloadProject}
            className="hidden sm:flex items-center gap-2 bg-white text-primary hover:bg-white/90 font-bold rounded-lg h-9"
          >
            <FolderArchive className="w-4 h-4" /> ፕሮጀክቱን አውርድ
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10 rounded-full h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-2xl border-none p-2">
              <DropdownMenuItem 
                className="flex items-center gap-3 py-3 px-4 cursor-pointer rounded-lg hover:bg-primary/5" 
                onClick={handleDownloadProject}
              >
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FolderArchive className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-sm">ፕሮጀክቱን አውርድ</span>
                  <span className="text-[10px] text-muted-foreground leading-none">Export for Camunda Modeler</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden p-4 gap-4">
        <div className="w-full lg:w-[350px] flex flex-col gap-3 shrink-0 overflow-y-auto lg:overflow-visible">
          <Card className="flex flex-col shadow-xl border-none bg-card h-full lg:h-auto lg:flex-1 rounded-xl overflow-hidden ring-1 ring-slate-100">
            <CardContent className="flex-1 flex flex-col gap-4 p-5">
              <div className="space-y-1.5">
                <Input
                  id="service-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="የአገልግሎቱ ስም (Service Title)"
                  className="bg-muted/30 border-muted focus:ring-primary h-10 rounded-lg font-medium text-sm"
                />
              </div>

              <div className="relative flex-1 flex flex-col">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="የሂደቱን ዝርዝር እዚህ ይጻፉ... (Process Steps Here)"
                  className="flex-1 w-full min-h-[300px] lg:min-h-0 resize-none font-body text-xs border-muted focus:ring-primary focus:border-primary p-4 rounded-lg shadow-inner bg-slate-50/50"
                />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleClear}
                    className="flex-1 items-center gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-muted rounded-lg h-11"
                  >
                    <Trash2 className="w-4 h-4" /> አጽዳ (Clear)
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleGenerate}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-11 rounded-lg text-sm font-bold shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <Sparkles className="w-4 h-4" /> አመንጭ (Generate)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <TabsList className="bg-muted/50 p-1 h-10 rounded-lg">
                <TabsTrigger value="diagram" className="flex items-center gap-1.5 rounded-md px-4 font-bold h-8 text-xs">
                  <Eye className="w-4 h-4" /> ዲያግራም (Diagram)
                </TabsTrigger>
                <TabsTrigger value="xml" className="flex items-center gap-1.5 rounded-md px-4 font-bold h-8 text-xs">
                  <Code className="w-4 h-4" /> ኮድ (XML)
                </TabsTrigger>
              </TabsList>
              
              {xmlResult && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={handleDownloadXML}
                    className="flex items-center gap-1.5 font-bold shadow-sm rounded-md h-8 px-3 text-xs"
                    title="Download BPMN XML"
                  >
                    <FileJson className="w-3.5 h-3.5" /> BPMN
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDownloadSVG}
                    className="flex items-center gap-1.5 font-bold rounded-md h-8 px-3 text-xs"
                    title="Download SVG (Vector)"
                  >
                    <FileType className="w-3.5 h-3.5" /> SVG
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDownloadPNG}
                    className="flex items-center gap-1.5 font-bold rounded-md h-8 px-3 text-xs"
                    title="Download High-Res PNG"
                  >
                    <Download className="w-3.5 h-3.5" /> PNG
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 w-8 p-0">
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>

            <Card className="flex-1 flex flex-col shadow-2xl border-none bg-white rounded-2xl overflow-hidden min-h-0 ring-1 ring-slate-200">
              <TabsContent value="diagram" className="flex-1 m-0 focus-visible:ring-0 h-full">
                {xmlResult ? (
                  <div className="h-full w-full">
                    <BPMNViewer xml={xmlResult} title={title || ""} ref={viewerRef} />
                  </div>
                ) : (
                  <EmptyState message="ዲያግራሙን እዚህ ለማየት የሂደቱን ዝርዝር መግለጫ ያስገቡ።" />
                )}
              </TabsContent>
              
              <TabsContent value="xml" className="flex-1 m-0 focus-visible:ring-0 h-full">
                {xmlResult ? (
                  <ScrollArea className="h-full w-full bg-slate-900">
                    <pre className="p-6 font-code text-[11px] leading-relaxed">
                      <code className="text-blue-300 block overflow-x-auto">
                        {xmlResult}
                      </code>
                    </pre>
                  </ScrollArea>
                ) : (
                  <EmptyState message="የምንጭ ኮድ እዚህ ይታያል።" />
                )}
              </TabsContent>
            </Card>
          </Tabs>
        </div>
      </main>
      
      <footer className="px-6 py-2 bg-white border-t border-muted hidden sm:flex items-center justify-between text-[10px] text-muted-foreground shrink-0 uppercase tracking-widest font-bold">
        <p>© {mounted ? new Date().getFullYear() : "...."} (ወርቁ) PRO ARCHITECT</p>
        <div className="flex items-center gap-6">
          <span className="text-primary">CAMUNDA COMPLIANT</span>
          <span>MANHATTAN ENGINE v2.0</span>
        </div>
      </footer>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground/30">
      <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mb-4">
        <FileCode className="w-10 h-10 opacity-10" />
      </div>
      <p className="text-xs font-bold max-w-[280px] leading-relaxed italic uppercase tracking-widest">
        {message}
      </p>
    </div>
  );
}
