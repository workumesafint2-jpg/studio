"use client";

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Copy, FileCode, Play, Trash2, CheckCircle2, Info, Eye, Code, Download } from "lucide-react";
import { generateBPMN } from "@/lib/bpmn-engine";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BPMNViewer, type BPMNViewerRef } from "@/components/bpmn-viewer";

export function BPMNFlowForgeApp() {
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("Process Diagram");
  const [xmlResult, setXmlResult] = useState("");
  const [activeTab, setActiveTab] = useState("diagram");
  const viewerRef = useRef<BPMNViewerRef>(null);
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!input.trim()) {
      toast({
        title: "No steps provided",
        description: "Please enter some process steps to generate BPMN.",
        variant: "destructive",
      });
      return;
    }
    const result = generateBPMN(input, title);
    setXmlResult(result);
    if (!xmlResult) {
      setActiveTab("diagram");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlResult);
    toast({
      title: "Copied!",
      description: "BPMN XML has been copied to your clipboard.",
    });
  };

  const handleDownloadPNG = async () => {
    if (viewerRef.current) {
      await viewerRef.current.exportPNG();
      toast({
        title: "Exporting...",
        description: "Your diagram is being saved as a PNG.",
      });
    }
  };

  const handleClear = () => {
    setInput("");
    setXmlResult("");
    setTitle("Process Diagram");
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 bg-primary text-primary-foreground shadow-lg shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-secondary rounded-lg">
            <FileCode className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight uppercase">(ወርቁ)</h1>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="hidden sm:inline-flex px-3 py-1 bg-accent text-primary border-none font-medium">
            Pro v1.2
          </Badge>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden p-4 sm:p-6 gap-4 sm:gap-6">
        {/* Left Side: Input */}
        <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col gap-4 shrink-0 overflow-y-auto lg:overflow-visible">
          <Card className="flex flex-col shadow-sm border-none bg-card h-full lg:h-auto lg:flex-1">
            <CardHeader className="shrink-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                Process Definition
              </CardTitle>
              <CardDescription>
                Set a title and list your process steps.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
              <div className="space-y-2">
                <Label htmlFor="service-title" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Service Name / Title
                </Label>
                <Input
                  id="service-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Customer Registration"
                  className="bg-muted/30 border-muted focus:ring-primary h-10 rounded-lg"
                />
              </div>

              <div className="relative flex-1 min-h-[200px] lg:min-h-0">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Process Steps
                </Label>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={"Enter your process steps...\nExample:\nRegister customer\nIs data valid?\nApprove request\nReject request"}
                  className="w-full h-[calc(100%-24px)] resize-none font-body text-base border-muted focus:ring-primary focus:border-primary p-4 rounded-xl transition-all"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={handleClear}
                  className="flex items-center gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" /> Clear
                </Button>
                <Button 
                  onClick={handleGenerate}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-4 sm:py-6 rounded-xl text-lg font-semibold shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" /> Generate
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-secondary/50 p-4 rounded-xl border border-secondary hidden sm:flex items-start gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-primary/80 leading-relaxed">
              <p className="font-semibold mb-1">Quick Tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Lines with <code className="bg-accent px-1 rounded text-primary">?</code> are <strong>Gateways</strong>.</li>
                <li><strong>Keywords:</strong> "reject", "fail" create terminal branches.</li>
                <li><strong>Loops:</strong> Use "back to [task]" to loop.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side: Output */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <TabsList className="bg-muted p-1">
                <TabsTrigger value="diagram" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" /> <span className="hidden xs:inline">Diagram</span>
                </TabsTrigger>
                <TabsTrigger value="xml" className="flex items-center gap-2">
                  <Code className="w-4 h-4" /> <span className="hidden xs:inline">XML</span>
                </TabsTrigger>
              </TabsList>
              
              {xmlResult && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDownloadPNG}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> <span className="hidden sm:inline">Download PNG</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCopy}
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" /> <span className="hidden sm:inline">Copy XML</span>
                  </Button>
                </div>
              )}
            </div>

            <Card className="flex-1 flex flex-col shadow-sm border-none bg-white overflow-hidden min-h-0">
              <TabsContent value="diagram" className="flex-1 m-0 focus-visible:ring-0 h-full">
                {xmlResult ? (
                  <div className="h-full w-full">
                    <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
                  </div>
                ) : (
                  <EmptyState message="Diagram will appear here." />
                )}
              </TabsContent>
              
              <TabsContent value="xml" className="flex-1 m-0 focus-visible:ring-0 h-full">
                {xmlResult ? (
                  <ScrollArea className="h-full w-full bg-slate-900">
                    <pre className="p-6 font-code text-sm leading-relaxed text-emerald-400 overflow-x-auto selection:bg-emerald-500/30">
                      <code>{xmlResult}</code>
                    </pre>
                  </ScrollArea>
                ) : (
                  <EmptyState message="Generated XML will appear here." />
                )}
              </TabsContent>
            </Card>
          </Tabs>
          
          {xmlResult && (
            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-700 font-medium">
                Diagram rendered successfully!
              </p>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="px-8 py-2 bg-white border-t border-muted hidden sm:flex items-center justify-between text-[10px] text-muted-foreground shrink-0">
        <p>© {new Date().getFullYear()} (ወርቁ) - Optimized for Tablets & Desktops</p>
        <p className="flex items-center gap-4">
          <span>PWA Ready</span>
          <span>Open Source</span>
        </p>
      </footer>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
        <FileCode className="w-6 h-6 opacity-20" />
      </div>
      <p className="text-sm max-w-[200px]">
        {message}
      </p>
    </div>
  );
}
