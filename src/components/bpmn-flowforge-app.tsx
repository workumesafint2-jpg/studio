"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Copy, FileCode, Play, Trash2, CheckCircle2, Info } from "lucide-react";
import { generateBPMN } from "@/lib/bpmn-engine";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function BPMNFlowForgeApp() {
  const [input, setInput] = useState("");
  const [xmlResult, setXmlResult] = useState("");
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
    const result = generateBPMN(input);
    setXmlResult(result);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlResult);
    toast({
      title: "Copied!",
      description: "BPMN XML has been copied to your clipboard.",
    });
  };

  const handleClear = () => {
    setInput("");
    setXmlResult("");
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-primary text-primary-foreground shadow-lg shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-secondary rounded-lg">
            <FileCode className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight font-headline uppercase">BPMN FlowForge</h1>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="px-3 py-1 bg-accent text-primary border-none font-medium">
            Beta v1.0
          </Badge>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden p-6 gap-6">
        {/* Left Side: Input */}
        <div className="flex-1 flex flex-col gap-4">
          <Card className="flex-1 flex flex-col shadow-sm border-none bg-card">
            <CardHeader className="shrink-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                Process Flow Definition
              </CardTitle>
              <CardDescription>
                List your process steps (one per line or comma separated). 
                Use question marks for decision gateways.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <div className="relative flex-1">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={"Enter your process steps...\nExample:\nRegister customer\nIs data valid?\nApprove request\nReject request"}
                  className="w-full h-full min-h-[300px] resize-none font-body text-base border-muted focus:ring-primary focus:border-primary p-4 rounded-xl transition-all"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <Button 
                  variant="outline" 
                  onClick={handleClear}
                  className="flex items-center gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Clear All
                </Button>
                <Button 
                  onClick={handleGenerate}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-xl text-lg font-semibold shadow-md flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" /> Generate XML
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-secondary/50 p-4 rounded-xl border border-secondary flex items-start gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-primary/80 leading-relaxed">
              <p className="font-semibold mb-1">Quick Tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>End a line with <code className="bg-accent px-1 rounded text-primary">?</code> to create a <strong>Gateway</strong>.</li>
                <li>Everything else becomes a standard <strong>BPMN Task</strong>.</li>
                <li>Download your XML and import it into any BPMN editor (Camunda, Modeler, etc).</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side: Output */}
        <div className="flex-1 flex flex-col gap-4">
          <Card className="flex-1 flex flex-col shadow-sm border-none bg-primary text-primary-foreground overflow-hidden">
            <CardHeader className="shrink-0 border-b border-white/10 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    BPMN 2.0 XML
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Industry-standard XML definition
                  </CardDescription>
                </div>
                {xmlResult && (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={handleCopy}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-none transition-all"
                  >
                    <Copy className="w-4 h-4" /> Copy Code
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
              {xmlResult ? (
                <ScrollArea className="h-full w-full bg-slate-900/50">
                  <pre className="p-6 font-code text-sm leading-relaxed text-emerald-400 overflow-x-auto selection:bg-emerald-500/30">
                    <code>{xmlResult}</code>
                  </pre>
                </ScrollArea>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center text-white/40">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <FileCode className="w-8 h-8" />
                  </div>
                  <p className="max-w-[280px]">
                    Generated XML will appear here after you input steps and click generate.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {xmlResult && (
            <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">
                XML Generated successfully! You can now copy and paste this into your favorite BPMN tool.
              </p>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="px-8 py-3 bg-white border-t border-muted flex items-center justify-between text-xs text-muted-foreground shrink-0">
        <p>© {new Date().getFullYear()} BPMN FlowForge - Precision Engineering for Process Design</p>
        <p className="flex items-center gap-4">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Open Source</span>
        </p>
      </footer>
    </div>
  );
}