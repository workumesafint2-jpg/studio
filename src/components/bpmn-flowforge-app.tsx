
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Trash2, 
  MoreVertical, 
  Eye, 
  FileType, 
  Sparkles, 
  Archive, 
  Database, 
  BarChart3, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  FileSearch, 
  ChevronDown, 
  Zap, 
  Activity,
  Loader2,
  Layout,
  FileJson,
  Upload,
  Download,
  FileUp,
  X,
  CalendarDays,
  Filter
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { suggestSteps } from "@/ai/flows/suggest-steps-flow";
import { Badge } from "@/components/ui/badge";
import JSZip from 'jszip';

interface VaultItem {
  id: string;
  systemCode: string;
  title: string;
  description: string;
  date: string;
  xml: string;
}

interface UploadedFile {
  id: string;
  name: string;
  category: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  dataUrl: string;
  type: string;
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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  // File Upload State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Report");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Filters
  const [vaultFilter, setVaultFilter] = useState<'all' | 'plan'>('all');

  const viewerRef = useRef<BPMNViewerRef>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredVault = useMemo(() => {
    if (vaultFilter === 'plan') {
      return vault.filter(item => item.title.toLowerCase().includes('እቅድ') || item.description.toLowerCase().includes('እቅድ'));
    }
    return vault;
  }, [vault, vaultFilter]);

  const filteredDocuments = useMemo(() => {
    if (vaultFilter === 'plan') {
      return uploadedFiles.filter(item => item.category === 'Plan' || item.name.toLowerCase().includes('እቅድ'));
    }
    return uploadedFiles;
  }, [uploadedFiles, vaultFilter]);

  if (!mounted) return null;

  const generateSystemCode = () => {
    const year = 2024;
    const count = (vault.length + uploadedFiles.length + 1).toString().padStart(3, '0');
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
      
      const newDoc: VaultItem = {
        id: Math.random().toString(36).substr(2, 9),
        systemCode: generateSystemCode(),
        title: title || "ያልተሰየመ ሂደት",
        description: input,
        date: new Date().toLocaleString('am-ET'),
        xml: result
      };
      
      setVault(prev => {
        if (prev.some(item => item.title === newDoc.title && item.description === newDoc.description)) return prev;
        return [newDoc, ...prev];
      });

      toast({ 
        title: "ተሳክቷል", 
        description: `ሪፎርሙ በቮልት (Vault) ውስጥ በኮድ ${newDoc.systemCode} ጸድቋል።` 
      });
    }
  };

  const handleAutoSuggest = async (docType: 'reform' | 'report' | 'guideline' | 'diagram' = 'reform') => {
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
      const result = await suggestSteps({ title, docType });
      if (result && result.steps) {
        setInput(result.steps);
        toast({ title: "ወርቁ ነኝ ዝግጁ ነው", description: "ቴክኒካዊ መግለጫው በራስ-ሰር ተዘጋጅቷል።" });
      }
    } catch (error: any) {
      toast({ 
        title: "የ AI ስህተት", 
        description: "ሂደቶቹን ማዘጋጀት አልተቻለም።", 
        variant: "destructive" 
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      if (!uploadName) setUploadName(e.target.files[0].name.split('.')[0]);
    }
  };

  const processUpload = () => {
    if (!selectedFile || !uploadName) {
      toast({ title: "ስህተት", description: "እባክዎን ፋይል ይምረጡ እና ስም ያስገቡ።", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: uploadName,
        category: uploadCategory,
        fileName: selectedFile.name,
        fileSize: (selectedFile.size / 1024).toFixed(1) + " KB",
        uploadDate: new Date().toLocaleString('am-ET'),
        dataUrl,
        type: selectedFile.type
      };

      setUploadedFiles(prev => [newFile, ...prev]);
      setIsUploadOpen(false);
      setSelectedFile(null);
      setUploadName("");
      toast({ title: "ተሳክቷል", description: "ፋይሉ በቢሮው መዝገብ ቤት ተቀምጧል።" });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDownloadFile = (file: UploadedFile) => {
    const link = document.createElement('a');
    link.href = file.dataUrl;
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "ማውረድ ተጀምሯል", description: `${file.fileName} በመውረድ ላይ ነው።` });
  };

  const handleDownloadProject = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const safeTitle = (title || "itdb-bureau-project").replace(/\s+/g, '-').toLowerCase();

      const currentXml = await viewerRef.current?.getXML() || xmlResult;
      const currentSvg = await viewerRef.current?.getSVG();
      
      if (currentXml) zip.file(`${safeTitle}.bpmn`, currentXml);
      if (currentSvg) zip.file(`${safeTitle}.svg`, currentSvg);

      zip.file("vault-manifest.json", JSON.stringify({
        diagrams: vault,
        documents: uploadedFiles
      }, null, 2));

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeTitle}-full-project.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "ተሳክቷል", description: "ሙሉ የቢሮው ፕሮጀክት ወርዷል።" });
    } catch (error) {
      toast({ title: "ስህተት", description: "ZIP ማጠናቀር አልተቻለም።", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const kpiValue = Math.min((vault.length + uploadedFiles.length) * 10, 100);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-white">
      <div className="h-1 w-full bg-[#1e3a8a]" />
      
      <header className="flex flex-col items-center justify-center py-2 px-8 bg-white border-b border-slate-100 shrink-0 z-10 relative text-center">
        <p className="text-[10px] font-bold text-[#1e3a8a] mb-0.5 tracking-widest uppercase" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
          ኢኖቬሽንና ቴክኖሎጂ ልማት ቢሮ
        </p>

        <h1 className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.4em]">
          Document Management System
        </h1>

        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-slate-300 hover:text-primary transition-colors">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-xl border-slate-100">
              <DropdownMenuLabel className="text-[10px] uppercase text-slate-400 px-3">አማራጮች</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => viewerRef.current?.exportXML()}>
                <FileJson className="w-4 h-4 mr-2 text-primary" /> BPMN (XML) ላክ
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => viewerRef.current?.exportSVG()}>
                <FileType className="w-4 h-4 mr-2 text-primary" /> SVG ላክ
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownloadProject} className="font-semibold text-primary">
                {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Archive className="w-4 h-4 mr-2" />}
                ሙሉ ፕሮጀክቱን አውርድ (ZIP)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex flex-col flex-1 overflow-hidden p-3 gap-3 bg-slate-50/50">
        <div className="flex flex-col lg:flex-row gap-3 h-full min-h-0">
          <div className="w-full lg:w-[360px] flex flex-col gap-3 shrink-0">
            <Card className="flex-1 shadow-sm border border-slate-200 rounded-xl overflow-hidden bg-white">
              <CardContent className="p-4 flex flex-col gap-4 h-full">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">የአገልግሎት ስም</label>
                    <span className="text-[8px] font-mono text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                      ID: {generateSystemCode()}
                    </span>
                  </div>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="የአገልግሎቱን ስም ያስገቡ..."
                    className="h-10 rounded-lg bg-slate-50 border-slate-100 focus:ring-primary text-sm font-medium"
                  />
                </div>

                <div className="relative flex-1 flex flex-col min-h-0">
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">የአገልግሎቱን ፍሰት ያስገቡ</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          disabled={isSuggesting}
                          className="h-6 px-2 text-[8px] text-[#1e3a8a] font-bold border border-[#1e3a8a]/20 rounded hover:bg-primary/5"
                        >
                          {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                          ወርቁ ነኝ ምን ልረዳዎት? <ChevronDown className="w-2 h-2 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-lg border-slate-100">
                        <DropdownMenuLabel className="text-[10px] uppercase text-slate-400 px-3">አውቶማቲክ ተግባር</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAutoSuggest('diagram')} className="text-xs py-2 font-semibold text-primary">
                          <Activity className="w-3.5 h-3.5 mr-2" /> የዲያግራም ዝርዝር ተግባር
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAutoSuggest('reform')} className="text-xs py-2">
                          <FileType className="w-3.5 h-3.5 mr-2 text-slate-400" /> የሪፎርም ሰነድ (Reform)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAutoSuggest('report')} className="text-xs py-2">
                          <FileText className="w-3.5 h-3.5 mr-2 text-slate-400" /> ቴክኒካዊ ሪፖርት (Report)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAutoSuggest('guideline')} className="text-xs py-2">
                          <ShieldCheck className="w-3.5 h-3.5 mr-2 text-slate-400" /> የአሰራር መመሪያ (Guideline)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="የሂደቱን ዝርዝር እዚህ ይግለጹ..."
                    className="flex-1 resize-none bg-slate-50 border-slate-100 rounded-lg p-3 text-xs font-medium leading-relaxed"
                  />
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" className="flex-1 h-10 rounded-lg text-slate-400 hover:text-red-500 transition-colors" onClick={() => { setInput(""); setTitle(""); }}>
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> አፅዳ
                  </Button>
                  <Button className="flex-1 h-10 rounded-lg bg-[#1e3a8a] text-white shadow-md hover:shadow-lg transition-all" onClick={handleGenerate}>
                    <Zap className="w-3.5 h-3.5 mr-2" /> አመንጭ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm mb-2 shrink-0">
                <TabsList className="bg-slate-50 h-9 p-1 rounded-lg border border-slate-100">
                  <TabsTrigger value="diagram" className="text-xs px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                    <Eye className="w-3.5 h-3.5 mr-2" /> ዲያግራም
                  </TabsTrigger>
                  <TabsTrigger value="vault" className="text-xs px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                    <Database className="w-3.5 h-3.5 mr-2" /> የቢሮ ቮልት (DMS)
                  </TabsTrigger>
                  <TabsTrigger value="dashboard" className="text-xs px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                    <BarChart3 className="w-3.5 h-3.5 mr-2" /> ዳሽቦርድ
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex gap-2">
                  {activeTab === "diagram" && xmlResult && (
                    <Button variant="default" size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 shadow-sm text-[10px]" onClick={() => viewerRef.current?.exportPNG()}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> እንደ ጸደቀ አውርድ
                    </Button>
                  )}
                  {activeTab === "vault" && (
                    <div className="flex gap-2 items-center">
                       <Button 
                        variant={vaultFilter === 'plan' ? 'default' : 'outline'} 
                        size="sm" 
                        className={`h-8 rounded-lg px-3 text-[10px] ${vaultFilter === 'plan' ? 'bg-[#1e3a8a]' : 'text-slate-500'}`}
                        onClick={() => setVaultFilter(vaultFilter === 'plan' ? 'all' : 'plan')}
                      >
                        <CalendarDays className="w-3.5 h-3.5 mr-2" /> ዓመታዊ እቅድ
                      </Button>

                      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                        <DialogTrigger asChild>
                          <Button variant="default" size="sm" className="h-8 bg-[#1e3a8a] hover:bg-primary/90 text-white rounded-lg px-3 shadow-sm text-[10px]">
                            <Upload className="w-3.5 h-3.5 mr-2" /> ፋይል ወደ መዝገብ ቤት አስገባ
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle className="text-sm font-bold uppercase tracking-widest text-[#1e3a8a]">አዲስ ፋይል አጽድቅ</DialogTitle>
                            <DialogDescription className="text-xs">
                              በቢሮው መዝገብ ቤት (DMS) ውስጥ ለማስቀመጥ የፈለጉትን ፋይል እዚህ ይስቀሉ።
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">የፋይሉ ስም</label>
                              <Input
                                value={uploadName}
                                onChange={(e) => setUploadName(e.target.value)}
                                placeholder="ለምሳሌ፡ የሪፎርም ሰነድ 2016"
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">የፋይል ምድብ</label>
                              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue placeholder="ምድብ ይምረጡ" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Plan">እቅድ (Plan)</SelectItem>
                                  <SelectItem value="Service Taxonomy">Service Taxonomy (የአገልግሎት ዝርዝር)</SelectItem>
                                  <SelectItem value="Report">Report (ሪፖርት)</SelectItem>
                                  <SelectItem value="Legal">Legal (ህጋዊ)</SelectItem>
                                  <SelectItem value="Other">Other (ሌላ)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ፋይል ይምረጡ</label>
                              <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {selectedFile ? (
                                      <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                                        <FileUp className="w-4 h-4" />
                                        {selectedFile.name}
                                      </div>
                                    ) : (
                                      <>
                                        <Upload className="w-5 h-5 mb-2 text-slate-400" />
                                        <p className="text-[10px] text-slate-500">ፋይሉን እዚህ ይጎትቱ ወይም ይጫኑ</p>
                                      </>
                                    )}
                                  </div>
                                  <input type="file" className="hidden" onChange={handleFileChange} />
                                </label>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(false)}>ሰርዝ</Button>
                            <Button size="sm" className="bg-[#1e3a8a]" onClick={processUpload}>አጽድቅ</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-0 relative">
                <TabsContent value="diagram" className="h-full m-0 p-0 overflow-hidden">
                  {xmlResult ? (
                    <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                      <Layout className="w-12 h-12 opacity-5" />
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">የጸደቀ ሪፎርም የለም</span>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="vault" className="h-full m-0 p-6">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-8">
                      {/* Section 1: Generated Diagrams */}
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center">
                            <Activity className="w-3.5 h-3.5 mr-2 text-primary" /> የሂደት ዲያግራሞች
                            {vaultFilter === 'plan' && <Badge variant="secondary" className="ml-2 text-[8px] bg-[#1e3a8a]/10 text-[#1e3a8a]">እቅዶች ብቻ</Badge>}
                          </h2>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                            ዲያግራሞች: {filteredVault.length}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredVault.length > 0 ? filteredVault.map((doc) => (
                            <Card key={doc.id} className="border-slate-100 shadow-none hover:border-primary/20 hover:shadow-md transition-all cursor-pointer group rounded-lg">
                              <CardHeader className="p-3 pb-1">
                                <div className="flex justify-between items-start">
                                  <span className="text-[8px] font-mono text-primary font-bold bg-primary/5 px-2 py-0.5 rounded">{doc.systemCode}</span>
                                  <span className="text-[8px] text-slate-400">{doc.date}</span>
                                </div>
                                <CardTitle className="text-xs font-bold text-slate-700 mt-1.5 group-hover:text-primary transition-colors">{doc.title}</CardTitle>
                              </CardHeader>
                              <CardContent className="p-3 pt-0">
                                <p className="text-[9px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">{doc.description}</p>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm" className="h-7 text-[9px] px-2 text-primary bg-primary/5 hover:bg-primary/10 rounded" onClick={() => { setXmlResult(doc.xml); setTitle(doc.title); setInput(doc.description); setActiveTab("diagram"); }}>
                                    <FileSearch className="w-3 h-3 mr-1" /> ክፈት
                                  </Button>
                                  {doc.title.toLowerCase().includes('እቅድ') && <Badge variant="outline" className="text-[8px] border-primary/20 text-primary ml-auto">እቅድ</Badge>}
                                </div>
                              </CardContent>
                            </Card>
                          )) : (
                            <div className="col-span-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                              <Archive className="w-8 h-8 text-slate-200 mb-2" />
                              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">የጸደቀ ዲያግራም የለም</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section 2: Uploaded Documents */}
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center">
                            <Database className="w-3.5 h-3.5 mr-2 text-[#1e3a8a]" /> የሰነዶች መዝገብ (DMS)
                            {vaultFilter === 'plan' && <Badge variant="secondary" className="ml-2 text-[8px] bg-[#1e3a8a]/10 text-[#1e3a8a]">እቅዶች ብቻ</Badge>}
                          </h2>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                            ሰነዶች: {filteredDocuments.length}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredDocuments.length > 0 ? filteredDocuments.map((file) => (
                            <Card key={file.id} className="border-slate-100 shadow-none hover:border-primary/20 hover:shadow-md transition-all rounded-lg">
                              <CardHeader className="p-3 pb-1">
                                <div className="flex justify-between items-start">
                                  <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded ${file.category === 'Plan' ? 'bg-[#1e3a8a] text-white' : 'bg-primary/5 text-primary'}`}>{file.category}</span>
                                  <span className="text-[8px] text-slate-400">{file.uploadDate}</span>
                                </div>
                                <CardTitle className="text-xs font-bold text-slate-700 mt-1.5">{file.name}</CardTitle>
                              </CardHeader>
                              <CardContent className="p-3 pt-0">
                                <div className="flex items-center gap-2 mb-3">
                                  <FileType className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-[9px] text-slate-500 font-medium truncate max-w-[150px]">{file.fileName}</span>
                                  <span className="text-[8px] text-slate-300 ml-auto">({file.fileSize})</span>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm" className="h-7 text-[9px] px-2 text-primary bg-primary/5 hover:bg-primary/10 rounded" onClick={() => handleDownloadFile(file)}>
                                    <Download className="w-3 h-3 mr-1" /> አውርድ
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 text-[9px] px-2 text-red-500 hover:bg-red-50 rounded ml-auto" onClick={() => setUploadedFiles(prev => prev.filter(f => f.id !== file.id))}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )) : (
                            <div className="col-span-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                              <Upload className="w-8 h-8 text-slate-200 mb-2" />
                              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">የተሰቀለ ፋይል የለም</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="dashboard" className="h-full m-0 p-8">
                  <div className="max-w-2xl mx-auto space-y-8">
                    <div className="text-center space-y-1">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-[0.2em]">የቢሮው አጠቃላይ አፈጻጸም (KPI)</h3>
                      <p className="text-[9px] text-slate-400 font-medium">በቮልት ውስጥ የተመዘገቡ የሂደት ማሻሻያዎችና ሰነዶች መገለጫ</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">የጸደቁ ሂደቶች</span>
                        <div className="text-xl font-black text-[#1e3a8a]">{vault.length}</div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">የተመዘገቡ ሰነዶች</span>
                        <div className="text-xl font-black text-primary">{uploadedFiles.length}</div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-end mb-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">ጠቅላላ የሪፎርም ደረጃ</span>
                          <div className="text-3xl font-black text-[#1e3a8a]">{kpiValue}%</div>
                        </div>
                      </div>
                      <Progress value={kpiValue} className="h-3 bg-slate-200 rounded-full overflow-hidden" />
                      <div className="mt-4 flex justify-between items-center text-[8px] font-bold uppercase text-slate-400">
                        <span>0% ጅማሮ</span>
                        <span>100% ተጠናቋል</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>
      
      <footer className="px-8 py-1 bg-white border-t border-slate-100 flex justify-between items-center text-[7px] font-bold uppercase text-slate-400 tracking-[0.2em] shrink-0">
        <div className="flex gap-6">
          <span>ITDB Portal v1.0</span>
          <span className="text-[#1e3a8a]/40">© 2024 Innovation and Technology Development Bureau</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div> System Live</span>
        </div>
      </footer>
    </div>
  );
}
