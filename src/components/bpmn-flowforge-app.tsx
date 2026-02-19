
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Trash2, 
  MoreVertical, 
  FileType, 
  Sparkles, 
  Archive, 
  Database, 
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
  CalendarDays,
  Target,
  Trophy,
  AlertTriangle,
  TrendingUp,
  BarChart
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { suggestSteps } from "@/ai/flows/suggest-steps-flow";
import { Badge } from "@/components/ui/badge";
import JSZip from 'jszip';
import { 
  Bar, 
  BarChart as RechartsBarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Legend,
  Cell
} from 'recharts';

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
  metricValue: number; // Planned for 'Plan', Actual for 'Report'
}

interface PerformanceMetric {
  serviceName: string;
  planned: number;
  actual: number;
  execution: number;
  status: 'Excellent' | 'On track' | 'Needs attention';
  color: string;
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
  const [uploadMetric, setUploadMetric] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Filters
  const [vaultFilter, setVaultFilter] = useState<'all' | 'plan'>('all');

  const viewerRef = useRef<BPMNViewerRef>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Performance Calculation Logic
  const performanceData = useMemo(() => {
    const metrics: Record<string, { planned: number; actual: number }> = {};
    
    uploadedFiles.forEach(file => {
      const name = file.name.toLowerCase().trim();
      if (!metrics[name]) metrics[name] = { planned: 0, actual: 0 };
      
      if (file.category === 'Plan') {
        metrics[name].planned = file.metricValue;
      } else if (file.category === 'Report') {
        metrics[name].actual = file.metricValue;
      }
    });

    return Object.entries(metrics)
      .filter(([_, data]) => data.planned > 0)
      .map(([name, data]) => {
        const execution = data.planned > 0 ? (data.actual / data.planned) * 100 : 0;
        let status: 'Excellent' | 'On track' | 'Needs attention' = 'Needs attention';
        let color = '#ef4444'; // Red

        if (execution >= 90) {
          status = 'Excellent';
          color = '#22c55e'; // Green
        } else if (execution >= 50) {
          status = 'On track';
          color = '#eab308'; // Yellow
        }

        return {
          serviceName: name.charAt(0).toUpperCase() + name.slice(1),
          planned: data.planned,
          actual: data.actual,
          execution: Math.round(execution),
          status,
          color
        } as PerformanceMetric;
      });
  }, [uploadedFiles]);

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
        type: selectedFile.type,
        metricValue: parseFloat(uploadMetric) || 0
      };

      setUploadedFiles(prev => [newFile, ...prev]);
      setIsUploadOpen(false);
      setSelectedFile(null);
      setUploadName("");
      setUploadMetric("");
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
        documents: uploadedFiles,
        performance: performanceData
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

  const avgExecution = performanceData.length > 0 
    ? Math.round(performanceData.reduce((acc, curr) => acc + curr.execution, 0) / performanceData.length)
    : 0;

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-white">
      <div className="h-1 w-full bg-[#1e3a8a]" />
      
      <header className="flex flex-col items-center justify-center py-2 px-8 bg-white border-b border-slate-100 shrink-0 z-10 relative text-center">
        <p className="text-[10px] font-bold text-[#1e3a8a] mb-0.5 tracking-widest uppercase" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
          ኢኖቬሽንና ቴክኖሎጂ ልማት ቢሮ
        </p>
        <h1 className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.4em]">Performance & Document Management</h1>

        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-[9px] font-bold border-slate-200" onClick={handleDownloadProject}>
            {isDownloading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Archive className="w-3 h-3 mr-2" />}
            ሙሉ ፕሮጀክት (ZIP)
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-slate-300">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-[10px] uppercase">አማራጮች</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => viewerRef.current?.exportXML()} className="text-xs">
                <FileJson className="w-4 h-4 mr-2" /> BPMN Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => viewerRef.current?.exportSVG()} className="text-xs">
                <FileType className="w-4 h-4 mr-2" /> SVG Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex flex-col flex-1 overflow-hidden p-3 gap-3 bg-slate-50/50">
        <div className="flex flex-col lg:flex-row gap-3 h-full min-h-0">
          {/* Sidebar Area */}
          <div className="w-full lg:w-[320px] flex flex-col gap-3 shrink-0">
            <Card className="flex-1 shadow-sm border border-slate-200 rounded-xl overflow-hidden bg-white">
              <CardContent className="p-4 flex flex-col gap-4 h-full">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">የአገልግሎት ስም</label>
                    <span className="text-[8px] font-mono text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">ID: {generateSystemCode()}</span>
                  </div>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="የአገልግሎቱን ስም ያስገቡ..."
                    className="h-10 rounded-lg bg-slate-50 border-slate-100 text-sm font-medium"
                  />
                </div>

                <div className="relative flex-1 flex flex-col min-h-0">
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">የአገልግሎቱን ፍሰት ያስገቡ</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={isSuggesting} className="h-6 px-2 text-[8px] text-[#1e3a8a] font-bold border border-[#1e3a8a]/20 rounded">
                          {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                          ወርቁ ነኝ ምን ልረዳዎት? <ChevronDown className="w-2 h-2 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => handleAutoSuggest('diagram')} className="text-xs font-semibold text-primary">
                          <Activity className="w-3.5 h-3.5 mr-2" /> የዲያግራም ዝርዝር ተግባር
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAutoSuggest('reform')} className="text-xs">የሪፎርም ሰነድ</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAutoSuggest('report')} className="text-xs">ቴክኒካዊ ሪፖርት</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAutoSuggest('guideline')} className="text-xs">የአሰራር መመሪያ</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="የሂደቱን ዝርዝር እዚህ ይግለጹ..."
                    className="flex-1 resize-none bg-slate-50 border-slate-100 rounded-lg text-xs"
                  />
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" className="flex-1 h-10 rounded-lg text-slate-400" onClick={() => { setInput(""); setTitle(""); }}>
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> አፅዳ
                  </Button>
                  <Button className="flex-1 h-10 rounded-lg bg-[#1e3a8a] text-white" onClick={handleGenerate}>
                    <Zap className="w-3.5 h-3.5 mr-2" /> አመንጭ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expanded Workspace Area */}
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
                <TabsList className="bg-slate-50 h-8 p-1">
                  <TabsTrigger value="diagram" className="text-[10px] px-4">ዲያግራም</TabsTrigger>
                  <TabsTrigger value="dashboard" className="text-[10px] px-4">አፈጻጸም (Performance)</TabsTrigger>
                </TabsList>
                
                <div className="flex gap-2">
                  <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 text-[9px] text-slate-500 border border-slate-100 rounded-lg">
                        <Upload className="w-3 h-3 mr-2" /> ፋይል አስገባ
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-sm font-bold uppercase tracking-widest text-[#1e3a8a]">አዲስ ፋይል አጽድቅ</DialogTitle>
                        <DialogDescription className="text-xs">በቢሮው መዝገብ ቤት (DMS) ውስጥ ለማስቀመጥ የፈለጉትን ፋይል እዚህ ይስቀሉ።</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400">የአገልግሎት/ፋይል ስም</label>
                          <Input value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="ለምሳሌ፡ ጥናትና ምርምር" className="h-9 text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400">ምድብ</label>
                          <Select value={uploadCategory} onValueChange={setUploadCategory}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="ምድብ" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Plan">እቅድ (Annual Plan)</SelectItem>
                              <SelectItem value="Report">ሪፖርት (Monthly/Quarterly Report)</SelectItem>
                              <SelectItem value="Service Taxonomy">Service Taxonomy</SelectItem>
                              <SelectItem value="Legal">Legal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400">ኢላማ/ውጤት (Metric Value)</label>
                          <Input type="number" value={uploadMetric} onChange={(e) => setUploadMetric(e.target.value)} placeholder="ለምሳሌ፡ 100" className="h-9 text-xs" />
                        </div>
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                          <div className="flex flex-col items-center justify-center text-[10px] text-slate-400">
                            {selectedFile ? selectedFile.name : "ፋይሉን እዚህ ይጎትቱ ወይም ይጫኑ"}
                          </div>
                          <input type="file" className="hidden" onChange={handleFileChange} />
                        </label>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(false)}>ሰርዝ</Button>
                        <Button size="sm" className="bg-[#1e3a8a]" onClick={processUpload}>አጽድቅ</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  {xmlResult && (
                    <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white text-[10px] px-4" onClick={() => viewerRef.current?.exportPNG()}>
                      <CheckCircle2 className="w-3 h-3 mr-2" /> እንደ ጸደቀ አውርድ
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-3 min-h-0 mt-3">
                <TabsContent value="diagram" className="flex-1 flex flex-col gap-3 m-0 p-0 overflow-hidden">
                  <div className="flex-[3] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative min-h-0">
                    {xmlResult ? (
                      <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                        <Layout className="w-12 h-12 opacity-10" />
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">የጸደቀ ሪፎርም የለም</span>
                      </div>
                    )}
                  </div>

                  {/* Performance Summary Table below Diagram */}
                  {performanceData.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 shrink-0">
                      <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-2 text-primary" /> የሂደት አፈጻጸም ማጠቃለያ (Performance Summary)
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 h-7">
                            <TableHead className="text-[8px] uppercase h-7">አገልግሎት (Service)</TableHead>
                            <TableHead className="text-[8px] uppercase h-7">ኢላማ (Planned)</TableHead>
                            <TableHead className="text-[8px] uppercase h-7">ውጤት (Actual)</TableHead>
                            <TableHead className="text-[8px] uppercase h-7">ልዩነት (Variance)</TableHead>
                            <TableHead className="text-[8px] uppercase h-7">ሁኔታ (Status)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {performanceData.slice(0, 3).map((item, idx) => (
                            <TableRow key={idx} className="h-7">
                              <TableCell className="text-[9px] font-semibold py-1">{item.serviceName}</TableCell>
                              <TableCell className="text-[9px] py-1">{item.planned}</TableCell>
                              <TableCell className="text-[9px] py-1">{item.actual}</TableCell>
                              <TableCell className="text-[9px] py-1">{item.actual - item.planned}</TableCell>
                              <TableCell className="py-1">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                  <span className="text-[8px] font-bold uppercase" style={{ color: item.color }}>{item.status}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <div className="flex-[1] bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[160px] overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                      <div className="flex items-center gap-3">
                        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                          <Database className="w-3.5 h-3.5 mr-2 text-primary" /> የቢሮ ቮልት (DMS)
                        </h2>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-6 text-[8px] font-bold rounded ${vaultFilter === 'plan' ? 'bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]' : 'text-slate-400 hover:bg-slate-100'}`}
                          onClick={() => setVaultFilter(vaultFilter === 'plan' ? 'all' : 'plan')}
                        >
                          <CalendarDays className="w-3 h-3 mr-1" /> ዓመታዊ እቅድ
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="flex-1">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                            <TableHead className="text-[9px] uppercase h-8 px-4">ስም (Title)</TableHead>
                            <TableHead className="text-[9px] uppercase h-8">ምድብ (Category)</TableHead>
                            <TableHead className="text-[9px] uppercase h-8">ኢላማ/ውጤት</TableHead>
                            <TableHead className="text-[9px] uppercase h-8">ቀን (Date)</TableHead>
                            <TableHead className="text-[9px] uppercase h-8 text-right">ተግባር</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredVault.map((doc) => (
                            <TableRow key={doc.id} className="group h-8">
                              <TableCell className="text-[10px] font-semibold py-1 px-4">{doc.title}</TableCell>
                              <TableCell className="py-1"><Badge variant="outline" className="text-[8px] h-4">ዲያግራም</Badge></TableCell>
                              <TableCell className="text-[9px] text-slate-400 py-1">-</TableCell>
                              <TableCell className="text-[9px] text-slate-400 py-1">{doc.date}</TableCell>
                              <TableCell className="text-right py-1">
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:text-primary" onClick={() => { setXmlResult(doc.xml); setTitle(doc.title); setInput(doc.description); }}>
                                  <FileSearch className="w-3 h-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredDocuments.map((file) => (
                            <TableRow key={file.id} className="group h-8">
                              <TableCell className="text-[10px] font-semibold py-1 px-4">{file.name}</TableCell>
                              <TableCell className="py-1">
                                <Badge variant="secondary" className={`text-[8px] h-4 ${file.category === 'Plan' ? 'bg-[#1e3a8a] text-white' : ''}`}>{file.category}</Badge>
                              </TableCell>
                              <TableCell className="text-[9px] font-mono text-slate-500 py-1">{file.metricValue}</TableCell>
                              <TableCell className="text-[9px] text-slate-400 py-1">{file.uploadDate}</TableCell>
                              <TableCell className="text-right py-1">
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:text-primary" onClick={() => handleDownloadFile(file)}>
                                  <Download className="w-3 h-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="dashboard" className="h-full m-0 p-6 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                    <Card className="bg-slate-50/50 border-slate-100 shadow-none">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-[#1e3a8a]/10 rounded-xl"><Trophy className="w-5 h-5 text-[#1e3a8a]" /></div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">አማካይ አፈጻጸም (Avg Execution)</p>
                          <h4 className="text-2xl font-black text-[#1e3a8a]">{avgExecution}%</h4>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-50/50 border-slate-100 shadow-none">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-xl"><Target className="w-5 h-5 text-green-600" /></div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ተጠናቀቁ አገልግሎቶች</p>
                          <h4 className="text-2xl font-black text-green-600">{performanceData.filter(d => d.execution >= 90).length}</h4>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-50/50 border-slate-100 shadow-none">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-xl"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ልዩ ክትትል የሚሹ</p>
                          <h4 className="text-2xl font-black text-red-600">{performanceData.filter(d => d.execution < 50).length}</h4>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="flex-1 flex flex-col shadow-none border-slate-100 overflow-hidden">
                    <CardContent className="p-4 flex-1 flex flex-col min-h-0">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-[0.2em] flex items-center">
                          <BarChart className="w-4 h-4 mr-2 text-primary" /> የቢሮው አጠቃላይ አፈጻጸም መግለጫ (Performance Overview)
                        </h3>
                      </div>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="serviceName" 
                              fontSize={10} 
                              fontWeight={600} 
                              tick={{ fill: '#64748b' }} 
                              axisLine={false} 
                              tickLine={false}
                            />
                            <YAxis 
                              fontSize={10} 
                              fontWeight={600} 
                              tick={{ fill: '#64748b' }} 
                              axisLine={false} 
                              tickLine={false}
                            />
                            <RechartsTooltip 
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                            <Bar dataKey="planned" name="ኢላማ (Target)" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={24} />
                            <Bar dataKey="actual" name="ውጤት (Actual)" radius={[4, 4, 0, 0]} barSize={24}>
                              {performanceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>
      
      <footer className="px-8 py-1 bg-white border-t border-slate-100 flex justify-between items-center text-[7px] font-bold uppercase text-slate-400 tracking-[0.2em] shrink-0">
        <div className="flex gap-6">
          <span>ITDB Portal v1.2 - Performance Engine Active</span>
          <span className="text-[#1e3a8a]/40">© 2024 Innovation and Technology Development Bureau</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Analytics Engine Live</span>
        </div>
      </footer>
    </div>
  );
}
