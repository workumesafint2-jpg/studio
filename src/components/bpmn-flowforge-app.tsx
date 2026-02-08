"use client";

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Copy, FileCode, Play, Trash2, Share2, MoreVertical, FolderArchive, Sparkles, Loader2, Eye, Code, Download, FileJson } from "lucide-react";
import { generateBPMN } from "@/lib/bpmn-engine";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BPMNViewer, type BPMNViewerRef } from "@/components/bpmn-viewer";
import { architectBPMN } from "@/ai/flows/bpmn-architect-flow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import JSZip from 'jszip';

export function BPMNFlowForgeApp() {
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [xmlResult, setXmlResult] = useState("");
  const [activeTab, setActiveTab] = useState("diagram");
  const [isArchitecting, setIsArchitecting] = useState(false);
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
    const result = generateBPMN(input, title || "Process Diagram");
    if (result) {
      setXmlResult(result);
      setActiveTab("diagram");
      toast({
        title: "Architecture Generated",
        description: "Your professional BPMN 2.0 diagram is ready.",
      });
    } else {
      toast({
        title: "Generation Error",
        description: "Could not parse process logic. Please check your steps.",
        variant: "destructive",
      });
    }
  };

  const handleAIArchitect = async () => {
    if (!input.trim()) {
      toast({
        title: "No description",
        description: "Tell the AI what process you want to architect.",
        variant: "destructive",
      });
      return;
    }

    setIsArchitecting(true);
    try {
      const result = await architectBPMN({ description: input, title });
      if (result) {
        setInput(result.structuredSteps);
        setTitle(result.refinedTitle);
        const diagramXml = generateBPMN(result.structuredSteps, result.refinedTitle);
        setXmlResult(diagramXml);
        setActiveTab("diagram");
        toast({
          title: "AI Analysis Complete",
          description: "Process logic structured and diagram updated.",
        });
      }
    } catch (error) {
      toast({
        title: "AI Failed",
        description: "Could not reach the BPMN brain. Ensure your API key is valid.",
        variant: "destructive",
      });
    } finally {
      setIsArchitecting(false);
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

  const handleDownloadProject = async () => {
    const zip = new JSZip();
    const fileName = (title || "process-diagram").replace(/\s+/g, '-').toLowerCase();
    
    // Allow download even if xmlResult is empty
    zip.file(`${fileName}.bpmn`, xmlResult || "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\" targetNamespace=\"http://bpmn.io/schema/bpmn\"></bpmn:definitions>");
    
    const readmeContent = `# ${title || 'BPMN Project'}\n\nGenerated with (ወርቁ) Pro.\n\n### Deployment:\n1. Open ${fileName}.bpmn in Camunda Modeler.\n2. Deploy to your process engine.`;
    zip.file("DEPLOYMENT_GUIDE.md", readmeContent);

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

      toast({
        title: "Project Bundle Ready",
        description: "Source files exported successfully.",
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "Could not bundle project.",
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    setInput("");
    setXmlResult("");
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-background">
      <header className="flex items-center justify-between px-6 py-4 bg-primary text-primary-foreground shadow-xl shrink-0 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-inner">
            <FileCode className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase">(ወርቁ) Pro</h1>
            <p className="text-[10px] opacity-70 font-medium tracking-widest uppercase">AI BPMN Architect</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={handleDownloadProject}
            className="hidden sm:flex items-center gap-2 bg-white text-primary hover:bg-white/90 font-bold rounded-xl"
          >
            <FolderArchive className="w-4 h-4" /> Download Project
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10 rounded-full h-9 w-9">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-2xl border-none p-2">
              <DropdownMenuItem 
                className="flex items-center gap-3 py-3 px-4 cursor-pointer rounded-lg hover:bg-primary/5 focus:bg-primary/5" 
                onClick={handleDownloadProject}
              >
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FolderArchive className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-sm">Download Project</span>
                  <span className="text-[10px] text-muted-foreground leading-none">Export for Camunda Modeler</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden p-6 gap-6">
        <div className="w-full lg:w-[420px] flex flex-col gap-4 shrink-0 overflow-y-auto lg:overflow-visible">
          <Card className="flex flex-col shadow-2xl border-none bg-card h-full lg:h-auto lg:flex-1 rounded-2xl overflow-hidden">
            <CardHeader className="shrink-0 bg-muted/30 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                Process Definition
              </CardTitle>
              <CardDescription className="text-xs">
                Describe your workflow in natural language or steps.
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
                  placeholder="ለምሳሌ: ፍቃድ መስጠት"
                  className="bg-muted/50 border-muted focus:ring-primary h-11 rounded-xl font-medium"
                />
              </div>

              <div className="relative flex-1 min-h-[250px] lg:min-h-0">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">
                  Process Narrative / Logic
                </Label>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={"Type a process description and click AI Architect..."}
                  className="w-full h-[calc(100%-24px)] resize-none font-body text-sm border-muted focus:ring-primary focus:border-primary p-4 rounded-xl shadow-inner bg-slate-50"
                />
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleClear}
                    className="flex-1 items-center gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-muted rounded-xl h-12"
                  >
                    <Trash2 className="w-4 h-4" /> Reset
                  </Button>
                  <Button 
                    onClick={handleGenerate}
                    className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground h-12 rounded-xl text-sm font-bold shadow flex items-center justify-center gap-2 transition-all"
                  >
                    <Play className="w-4 h-4" /> Preview
                  </Button>
                </div>
                <Button 
                  onClick={handleAIArchitect}
                  disabled={isArchitecting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-xl text-base font-bold shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  {isArchitecting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 hidden sm:flex items-start gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Share2 className="w-5 h-5 text-primary shrink-0" />
            </div>
            <div className="text-[11px] text-primary/80 leading-relaxed">
              <p className="font-bold mb-1 uppercase tracking-wider text-primary">Architect Tips:</p>
              <ul className="space-y-1 opacity-90">
                <li>• Use AI Architect for messy text.</li>
                <li>• (serviceTask) for auto steps.</li>
                <li>• Use "Parallel" for branching.</li>
                <li>• Use "Timer:" for delays.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <TabsList className="bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="diagram" className="flex items-center gap-2 rounded-lg px-4 font-bold">
                  <Eye className="w-4 h-4" /> Live Canvas
                </TabsTrigger>
                <TabsTrigger value="xml" className="flex items-center gap-2 rounded-lg px-4 font-bold">
                  <Code className="w-4 h-4" /> Source
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
                    <FileJson className="w-4 h-4" /> XML
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDownloadPNG}
                    className="flex items-center gap-2 font-bold rounded-lg"
                  >
                    <Download className="w-4 h-4" /> PNG
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="h-9 w-9 p-0">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <Card className="flex-1 flex flex-col shadow-2xl border-none bg-white rounded-3xl overflow-hidden min-h-0 ring-1 ring-slate-200">
              <TabsContent value="diagram" className="flex-1 m-0 focus-visible:ring-0 h-full">
                {xmlResult ? (
                  <div className="h-full w-full">
                    <BPMNViewer xml={xmlResult} title={title || "Process Diagram"} ref={viewerRef} />
                  </div>
                ) : (
                  <EmptyState message="Architect your process to see the diagram." />
                )}
              </TabsContent>
              
              <TabsContent value="xml" className="flex-1 m-0 focus-visible:ring-0 h-full">
                {xmlResult ? (
                  <ScrollArea className="h-full w-full bg-slate-900">
                    <pre className="p-8 font-code text-xs">
                      <code className="text-blue-300 block overflow-x-auto">
                        {xmlResult}
                      </code>
                    </pre>
                  </ScrollArea>
                ) : (
                  <EmptyState message="XML source code will appear here." />
                )}
              </TabsContent>
            </Card>
          </Tabs>
        </div>
      </main>
      
      <footer className="px-8 py-3 bg-white border-t border-muted hidden sm:flex items-center justify-between text-[10px] text-muted-foreground shrink-0 uppercase tracking-widest font-bold">
        <p>© {new Date().getFullYear()} (ወርቁ) Pro Architect</p>
        <p className="flex items-center gap-6">
          <span className="text-primary">Enterprise Ready</span>
          <span>Snake Layout Engine</span>
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
