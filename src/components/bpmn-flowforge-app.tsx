
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Layout,
  Loader2,
  Archive,
  Database,
  BarChart3,
  FileText,
  ShieldCheck,
  CheckCircle2,
  FileSearch
} from "lucide-react";
import { generateBPMN } from "@/lib/bpmn-engine";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BPMNViewer, type BPMNViewerRef } from "@/components/bpmn-viewer";
import { Progress } from "@/components/ui/progress";
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
import { suggestSteps } from "@/ai/flows/suggest-steps-flow";
import JSZip from 'jszip';

interface VaultItem {
  id: string;
  systemCode: string;
  title: string;
  description: string;
  date: string;
  xml: string;
}

export function BPMNFlowForgeApp() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [xmlResult, setXmlResult] = useState("");
  const [activeTab, setActiveTab] = useState("diagram");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [vault, setVault] = useState<VaultItem[]>([]);
  const viewerRef = useRef<BPMNViewerRef>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const generateSystemCode = () => {
    const year = new Date().getFullYear();
    const count = (vault.length + 1).toString().padStart(3, '0');
    return `ITDB-${year}-${count}`;
  };

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
      
      // Auto-Vault Logic
      const newDoc: VaultItem = {
        id: Math.random().toString(36).substr(2, 9),
        systemCode: generateSystemCode(),
        title: title || "ያልተሰየመ ሂደት",
        description: input,
        date: new Date().toLocaleDateString('am-ET'),
        xml: result
      };
      setVault(prev => [newDoc, ...prev]);

      toast({ 
        title: "ተሳክቷል", 
        description: `BPMN ዲያግራም ተፈጥሯል እና በቮልት (Vault) ውስጥ በኮድ ${newDoc.systemCode} ተቀምጧል።` 
      });
    }
  };

  const handleAutoSuggest = async () => {
    if (!title.trim()) {
      toast({ 
        title: "መረጃ የለም", 
        description: "እባክዎን መጀመሪያ የአገልግሎቱን ስም ያስገቡ።", 
        variant: "destructive" 
      });
      return;
    }

    setIsSuggesting(true);
    try {
      const result = await suggestSteps({ title });
      if (result && result.steps) {
        setInput(result.steps);
        toast({ title: "የሪፎርም ሪፖርት ተዘጋጅቷል", description: "ሂደቶቹ እና ቴክኒካዊ መግለጫው በራስ-ሰር ተፈጥረዋል።" });
      }
    } catch (error: any) {
      console.error("AI Suggestion Error:", error);
      toast({ 
        title: "የ AI ስህተት", 
        description: "ሂደቶቹን ማመንጨት አልተቻለም።", 
        variant: "destructive" 
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleDownloadProject = async () => {
    setIsDownloading(true);
    toast({ title: "በዝግጅት ላይ...", description: "ሙሉ የሲስተም ፕሮጀክቱ እየተቀናበረ ነው..." });

    try {
      const zip = new JSZip();
      const safeTitle = (title || "itdb-system-project").replace(/\s+/g, '-').toLowerCase();

      // 1. Current Diagram Assets
      const currentXml = await viewerRef.current?.getXML();
      zip.file(`${safeTitle}.bpmn`, currentXml || xmlResult || '<!-- No diagram -->');
      const currentSvg = await viewerRef.current?.getSVG();
      if (currentSvg) zip.file(`${safeTitle}.svg`, currentSvg);

      // 2. Full Source Code Emulation (Core Files)
      zip.file("package.json", JSON.stringify({
        name: "itdb-bpm-system",
        version: "1.0.0",
        dependencies: { "bpmn-js": "^18.1.1", "jszip": "^3.10.1", "next": "15.5.9" }
      }, null, 2));

      zip.file("capacitor.config.json", JSON.stringify({
        appId: "com.itdb.bpm",
        appName: "ITDB BPM System",
        webDir: "out"
      }, null, 2));

      // 3. Vault Manifest
      zip.file("bureau-vault-manifest.json", JSON.stringify(vault, null, 2));

      // 4. README
      zip.file("README.txt", `ITDB - Innovation and Technology Development Bureau\n\nይህ የ ZIP ፋይል ሙሉውን የቢሮ ሲስተም እና የሪፎርም ሰነዶች ይዟል።\nጠቅላላ ሰነዶች: ${vault.length}\nቀን: ${new Date().toLocaleString()}`);

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeTitle}-full-source.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "ተሳክቷል", description: "ሙሉ ፕሮጀክቱ እና የቮልት ፋይሎች ወርደዋል።" });
    } catch (error) {
      toast({ title: "የስርዓት ስህተት", description: "ZIP ማጠናቀር አልተቻለም።", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-white">
      <div className="h-2 w-full bg-[#1e3a8a]" />
      
      <header className="flex flex-col items-center justify-center py-4 px-8 bg-white border-b border-slate-100 shrink-0 z-10 relative text-center">
        <h1 className="text-xl font-bold text-[#1e3a8a] mb-1" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
          ኢኖቬሽንና ቴክኖሎጂ ልማት ቢሮ
        </h1>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-[#1e3a8a] rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-[8px] tracking-tighter">ITDB</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bureau Management System</span>
        </div>

        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-slate-400 hover:text-primary">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl">
              <DropdownMenuItem onClick={() => viewerRef.current?.exportXML()}>
                <FileJson className="w-4 h-4 mr-2 text-primary" /> BPMN (XML) ላክ
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => viewerRef.current?.exportSVG()}>
                <FileType className="w-4 h-4 mr-2 text-primary" /> SVG ላክ
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadProject} className="border-t mt-2 pt-2">
                {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Archive className="w-4 h-4 mr-2 text-primary" />}
                ሙሉ ፕሮጀክቱን አውርድ (ZIP)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden p-6 gap-6 bg-slate-50/50">
        <div className="w-full lg:w-[400px] flex flex-col gap-4 shrink-0">
          <Card className="flex-1 shadow-sm border border-slate-200 rounded-xl overflow-hidden bg-white">
            <CardContent className="p-6 flex flex-col gap-6 h-full">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">የአገልግሎት/የሪፎርም መለያ</label>
                  <span className="text-[9px] font-mono text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                    ID: {generateSystemCode()}
                  </span>
                </div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="የአገልግሎቱን ስም እዚህ ያስገቡ..."
                  className="h-11 rounded-lg bg-slate-50 border-slate-200 focus:ring-primary text-sm font-medium"
                />
              </div>

              <div className="relative flex-1 flex flex-col">
                <div className="flex justify-between items-end mb-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ቴክኒካዊ መግለጫ እና ሪፖርት</label>
                  {title.trim() && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleAutoSuggest} 
                      disabled={isSuggesting}
                      className="h-6 px-2 text-[9px] text-[#1e3a8a] font-bold"
                    >
                      {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                      ወርቁ ነኝ ዝርዝሩን ላዘጋጅልህ/ልሽ
                    </Button>
                  )}
                </div>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="የሪፎርም ሂደቱን ዝርዝር እዚህ ይግለጹ..."
                  className="flex-1 resize-none bg-slate-50 border-slate-200 rounded-lg p-4 text-xs font-medium leading-relaxed"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-11 rounded-lg text-slate-500" onClick={() => { setInput(""); setTitle(""); }}>
                  <Trash2 className="w-4 h-4 mr-2" /> አፅዳ
                </Button>
                <Button className="flex-1 h-11 rounded-lg bg-[#1e3a8a] text-white" onClick={handleGenerate}>
                  <ShieldCheck className="w-4 h-4 mr-2" /> ሪፎርሙን አጽድቅ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm mb-4">
              <TabsList className="bg-slate-100 h-9 p-1 rounded-lg">
                <TabsTrigger value="diagram" className="text-xs px-4">
                  <Eye className="w-3.5 h-3.5 mr-2" /> ዲያግራም
                </TabsTrigger>
                <TabsTrigger value="vault" className="text-xs px-4">
                  <Database className="w-3.5 h-3.5 mr-2" /> የቢሮ ቮልት (DMS)
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="text-xs px-4">
                  <BarChart3 className="w-3.5 h-3.5 mr-2" /> ዳሽቦርድ (KPI)
                </TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                {activeTab === "diagram" && xmlResult && (
                  <Button variant="default" size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white" onClick={() => viewerRef.current?.exportPNG()}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> እንደ ጸደቀ ሰነድ አስቀምጥ
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-0 relative">
              <TabsContent value="diagram" className="h-full m-0 p-0">
                {xmlResult ? (
                  <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                    <Layout className="w-12 h-12 opacity-10" />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-30">ዝግጁ የሆነ ሰነድ የለም</span>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="vault" className="h-full m-0 p-6">
                <ScrollArea className="h-full pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vault.length > 0 ? vault.map((doc) => (
                      <Card key={doc.id} className="border-slate-100 shadow-none hover:border-primary/20 transition-all cursor-pointer">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-mono text-primary font-bold">{doc.systemCode}</span>
                            <span className="text-[9px] text-slate-400">{doc.date}</span>
                          </div>
                          <CardTitle className="text-sm font-bold text-slate-700 mt-1">{doc.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-[10px] text-slate-500 line-clamp-2 mb-3">{doc.description}</p>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 text-primary" onClick={() => { setXmlResult(doc.xml); setTitle(doc.title); setInput(doc.description); setActiveTab("diagram"); }}>
                              <FileSearch className="w-3 h-3 mr-1" /> ክፈት
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 text-slate-400">
                              <FileText className="w-3 h-3 mr-1" /> ሪፖርት
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )) : (
                      <div className="col-span-full h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl">
                        <Archive className="w-8 h-8 text-slate-100 mb-2" />
                        <span className="text-[10px] font-bold text-slate-300 uppercase">በቮልት ውስጥ ምንም ሰነድ የለም</span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="dashboard" className="h-full m-0 p-8">
                <div className="max-w-2xl mx-auto space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" /> የሪፎርም አፈጻጸም ደረጃ (KPI)
                    </h3>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-end mb-4">
                        <span className="text-xs font-bold text-slate-500">የጸደቁ ሂደቶች ብዛት: {vault.length}</span>
                        <span className="text-2xl font-black text-primary">{Math.min(vault.length * 15, 100)}%</span>
                      </div>
                      <Progress value={Math.min(vault.length * 15, 100)} className="h-3 bg-slate-200" />
                      <p className="text-[10px] text-slate-400 mt-4 leading-relaxed italic">
                        * ይህ መረጃ በቢሮው የተመዘገቡ እና የጸደቁ የሪፎርም ሂደቶችን መሰረት በማድረግ የሚሰላ ነው።
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-primary/5 border-none shadow-none p-4">
                      <span className="text-[10px] font-bold text-primary/60 uppercase block mb-1">ጠቅላላ ሰነዶች</span>
                      <span className="text-2xl font-black text-primary">{vault.length}</span>
                    </Card>
                    <Card className="bg-green-50 border-none shadow-none p-4">
                      <span className="text-[10px] font-bold text-green-600/60 uppercase block mb-1">ገባሪ ሪፎርሞች</span>
                      <span className="text-2xl font-black text-green-600">{Math.ceil(vault.length * 0.8)}</span>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
      
      <footer className="px-8 py-3 bg-white border-t border-slate-200 flex justify-between items-center text-[9px] font-bold uppercase text-slate-400 tracking-wider shrink-0">
        <div className="flex gap-6">
          <span>ITDB Bureau Management System v7.0</span>
          <span className="text-[#1e3a8a]/60">© 2024 የኢኖቬሽንና ቴክኖሎጂ ልማት ቢሮ</span>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> DMS Active</span>
          <span>Security Level: High</span>
        </div>
      </footer>
    </div>
  );
}
