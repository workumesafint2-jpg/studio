
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
  BarChart,
  SeparatorHorizontal,
  Filter,
  Layers,
  Search,
  FileText,
  Clock,
  ShieldCheck
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
import { Separator } from "@/components/ui/separator";
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
import { BUREAU_SERVICES_REGISTRY } from '@/lib/services-registry';

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
  planType?: string;
  reportType?: string;
  taxonomyService?: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  dataUrl: string;
  type: string;
  metricValue: number;
  status: 'Processing' | 'Active & Filed';
}

interface PerformanceMetric {
  serviceName: string;
  period: string;
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
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadName, setUploadName] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Plan");
  const [uploadPlanType, setUploadPlanType] = useState("Annual Plan");
  const [uploadReportType, setUploadReportType] = useState("Monthly Report");
  const [uploadTaxonomyService, setUploadTaxonomyService] = useState(BUREAU_SERVICES_REGISTRY[0].title);
  const [uploadMetric, setUploadMetric] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [vaultFilter, setVaultFilter] = useState<'all' | 'Plan' | 'Report' | 'Service Taxonomy' | 'Reform Documents'>('all');

  const viewerRef = useRef<BPMNViewerRef>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const performanceData = useMemo(() => {
    const metrics: Record<string, { planned: number; actual: number; period: string }> = {};
    
    uploadedFiles.forEach(file => {
      const name = file.name.toLowerCase().trim();
      const period = file.planType || file.reportType || "General";
      const key = `${name}-${period}`;

      if (!metrics[key]) metrics[key] = { planned: 0, actual: 0, period };
      
      if (file.category === 'Plan') {
        metrics[key].planned = file.metricValue;
      } else if (file.category === 'Report') {
        metrics[key].actual = file.metricValue;
      }
    });

    return Object.entries(metrics)
      .filter(([_, data]) => data.planned > 0)
      .map(([key, data]) => {
        const name = key.split('-')[0];
        const execution = data.planned > 0 ? (data.actual / data.planned) * 100 : 0;
        let status: 'Excellent' | 'On track' | 'Needs attention' = 'Needs attention';
        let color = '#22c55e';

        if (execution >= 90) {
          status = 'Excellent';
          color = '#22c55e';
        } else if (execution >= 50) {
          status = 'On track';
          color = '#eab308';
        } else {
          color = '#ef4444';
        }

        return {
          serviceName: name.charAt(0).toUpperCase() + name.slice(1),
          period: data.period,
          planned: data.planned,
          actual: data.actual,
          execution: Math.round(execution),
          status,
          color
        } as PerformanceMetric;
      });
  }, [uploadedFiles]);

  const filteredDocuments = useMemo(() => {
    if (vaultFilter === 'all') return uploadedFiles;
    return uploadedFiles.filter(item => item.category === vaultFilter);
  }, [uploadedFiles, vaultFilter]);

  const filteredVault = useMemo(() => {
    // Current diagram vault filtering logic
    return vault;
  }, [vault]);

  if (!mounted) return null;

  const generateSystemCode = () => {
    const year = 2024;
    const count = (vault.length + uploadedFiles.length + 1).toString().padStart(3, '0');
    return `ITDB-${year}-${count}`;
  };

  const handleGenerate = () => {
    if (!input.trim()) {
      toast({ title: "መረጃ የለም", description: "እባክዎን የሂደቱን ዝርዝር መግለጫ ያስገቡ።", variant: "destructive" });
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
      
      setVault(prev => [newDoc, ...prev]);

      toast({ title: "ተሳክቷል", description: `ሪፎርሙ በቮልት (Vault) ውስጥ በኮድ ${newDoc.systemCode} ጸድቋል።` });
    }
  };

  const handleAutoSuggest = async (docType: 'reform' | 'report' | 'guideline' | 'diagram' = 'reform') => {
    if (!title.trim()) {
      toast({ title: "መረጃ የለም", description: "እባክዎን መጀመሪያ የአገልግሎቱን ስም ያስገቡ።", variant: "destructive" });
      return;
    }

    setIsSuggesting(true);
    try {
      const result = await suggestSteps({ title, docType });
      if (result && result.steps) {
        setInput(result.steps);
        toast({ title: "ወርቁ ነኝ ዝግጁ ነው", description: "ቴክኒካዊ መግለጫው በራስ-ሰር ተዘጋጅቷል (Vault Aware)." });
      }
    } catch (error: any) {
      toast({ title: "የ AI ስህተት", description: "ሂደቶቹን ማዘጋጀት አልተቻለም።", variant: "destructive" });
    } finally {
      setIsSuggesting(false);
    }
  };

  const processUpload = () => {
    if (!selectedFile || !uploadName) {
      toast({ title: "ስህተት", description: "እባክዎን ፋይል ይምረጡ እና ስም ያስገቡ።", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            
            const newFile: UploadedFile = {
              id: Math.random().toString(36).substr(2, 9),
              name: uploadName,
              category: uploadCategory,
              planType: uploadCategory === 'Plan' ? uploadPlanType : undefined,
              reportType: uploadCategory === 'Report' ? uploadReportType : undefined,
              taxonomyService: uploadCategory === 'Service Taxonomy' ? uploadTaxonomyService : undefined,
              fileName: selectedFile.name,
              fileSize: (selectedFile.size / 1024).toFixed(1) + " KB",
              uploadDate: new Date().toLocaleString('am-ET'),
              dataUrl,
              type: selectedFile.type,
              metricValue: parseFloat(uploadMetric) || 0,
              status: 'Active & Filed'
            };

            setUploadedFiles(prev => [newFile, ...prev]);
            setIsUploading(false);
            setIsUploadOpen(false);
            setSelectedFile(null);
            setUploadName("");
            setUploadMetric("");
            setUploadProgress(0);
            
            toast({ 
              title: "አግብቷል & ተመዝግቧል", 
              description: `${newFile.name} በቢሮው መዝገብ ቤት (DMS) በቋሚነት ተቀምጧል።`,
              className: "bg-green-50 border-green-200"
            });
            return 100;
          }
          return prev + 20;
        });
      }, 200);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDownloadProject = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const safeTitle = (title || "itdb-project").replace(/\s+/g, '-').toLowerCase();
      const currentXml = await viewerRef.current?.getXML() || xmlResult;
      if (currentXml) zip.file(`${safeTitle}.bpmn`, currentXml);
      zip.file("vault-manifest.json", JSON.stringify({ diagrams: vault, documents: uploadedFiles }, null, 2));
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeTitle}-full-project.zip`;
      link.click();
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
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <div className="h-1 w-full bg-[#1e3a8a] shrink-0" />
      
      <header className="flex flex-col items-center justify-center py-3 px-8 bg-white border-b border-slate-100 shrink-0 sticky top-0 z-[100] relative">
        <p className="text-[10px] font-bold text-[#1e3a8a] mb-0.5 tracking-widest uppercase">ኢኖቬሽንና ቴክኖሎጂ ልማት ቢሮ</p>
        <h1 className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.4em]">Performance & Document Management Portal</h1>

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
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => viewerRef.current?.exportXML()}>BPMN Export</DropdownMenuItem>
              <DropdownMenuItem onClick={() => viewerRef.current?.exportSVG()}>SVG Export</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex flex-col flex-1 p-3 gap-3 bg-slate-50/50 overflow-hidden">
        {/* Input Area */}
        <div className="w-full shrink-0">
          <Card className="shadow-sm border border-slate-200 rounded-xl overflow-hidden bg-white">
            <CardContent className="p-4 flex flex-col lg:flex-row gap-4">
              <div className="flex-1 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">የአገልግሎት ስም</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="የአገልግሎቱን ስም ያስገቡ..." className="h-10 text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 h-10 bg-[#1e3a8a]" onClick={handleGenerate}><Zap className="w-3.5 h-3.5 mr-2" /> አመንጭ</Button>
                  <Button variant="outline" className="h-10 w-10 p-0 text-slate-400" onClick={() => { setInput(""); setTitle(""); }}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="flex-[2] flex flex-col">
                <div className="flex justify-between items-end mb-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">የአገልግሎቱን ፍሰት ያስገቡ</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[8px] text-[#1e3a8a] font-bold border border-[#1e3a8a]/20 rounded">
                        {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        ወርቁ ነኝ ምን ልረዳዎት? <ChevronDown className="w-2 h-2 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => handleAutoSuggest('diagram')} className="text-xs font-semibold text-primary">የዲያግራም ዝርዝር ተግባር</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleAutoSuggest('reform')} className="text-xs">የሪፎርም ሰነድ (Reform)</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAutoSuggest('report')} className="text-xs">ቴክኒካዊ ሪፖርት</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAutoSuggest('guideline')} className="text-xs">የአሰራር መመሪያ</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="የሂደቱን ዝርዝር እዚህ ይግለጹ..." className="flex-1 min-h-[100px] text-xs" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 60/40 Split View */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col w-full h-full min-h-0">
            <div className="flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <TabsList className="bg-slate-50 h-8 p-1">
                <TabsTrigger value="diagram" className="text-[10px] px-4">ዲያግራም</TabsTrigger>
                <TabsTrigger value="dashboard" className="text-[10px] px-4">አፈጻጸም (Performance)</TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 text-[9px] text-[#1e3a8a] font-bold border border-[#1e3a8a]/20 rounded-lg">
                      <Upload className="w-3 h-3 mr-2" /> ፋይል አስገባ (Plan/Report)
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="z-[200]">
                    <DialogHeader>
                      <DialogTitle className="text-sm font-bold uppercase tracking-widest text-[#1e3a8a]">አዲስ ፋይል አጽድቅ (DMS Registry)</DialogTitle>
                      <DialogDescription className="text-xs">በቢሮው መዝገብ ቤት ውስጥ ለማስቀመጥ የፈለጉትን ፋይል እዚህ ይስቀሉ።</DialogDescription>
                    </DialogHeader>
                    {isUploading ? (
                      <div className="py-8 space-y-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-primary animate-pulse">ፋይሉን በመተንተን ላይ...</span>
                          <span className="font-mono">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    ) : (
                      <div className="grid gap-4 py-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400">የአገልግሎት/ፋይል ስም</label>
                          <Input value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="ለምሳሌ፡ ጥናትና ምርምር" className="h-9 text-xs" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400">ምድብ (Category)</label>
                            <Select value={uploadCategory} onValueChange={setUploadCategory}>
                              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Plan">እቅድ (Plan)</SelectItem>
                                <SelectItem value="Report">ሪፖርት (Report)</SelectItem>
                                <SelectItem value="Service Taxonomy">Service Taxonomy</SelectItem>
                                <SelectItem value="Reform Documents">የሪፎርም ሰነዶች</SelectItem>
                                <SelectItem value="Other">ሌሎች</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {uploadCategory === 'Plan' && (
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400">የእቅድ ዓይነት</label>
                              <Select value={uploadPlanType} onValueChange={setUploadPlanType}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Strategic Plan">ስትራቴጂካዊ እቅድ</SelectItem>
                                  <SelectItem value="Annual Plan">የዓመት እቅድ</SelectItem>
                                  <SelectItem value="Quarterly Plan">የሩብ ዓመት እቅድ</SelectItem>
                                  <SelectItem value="Monthly Plan">የወር እቅድ</SelectItem>
                                  <SelectItem value="Individual/Team Plan">የግል/የቡድን እቅድ</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {uploadCategory === 'Report' && (
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400">የሪፖርት ዓይነት</label>
                              <Select value={uploadReportType} onValueChange={setUploadReportType}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Weekly Report">የሳምንት ሪፖርት</SelectItem>
                                  <SelectItem value="Monthly Report">የወር ሪፖርት</SelectItem>
                                  <SelectItem value="Quarterly Report">የሩብ ዓመት ሪፖርት</SelectItem>
                                  <SelectItem value="Annual Performance Report">የዓመት አፈጻጸም ሪፖርት</SelectItem>
                                  <SelectItem value="Special/Ad-hoc Report">ልዩ/ድንገተኛ ሪፖርት</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {uploadCategory === 'Service Taxonomy' && (
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400">Service Selection</label>
                              <Select value={uploadTaxonomyService} onValueChange={setUploadTaxonomyService}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {BUREAU_SERVICES_REGISTRY.map(s => (
                                    <SelectItem key={s.title} value={s.title}>{s.title}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400">ኢላማ/ውጤት (Metric)</label>
                          <Input type="number" value={uploadMetric} onChange={(e) => setUploadMetric(e.target.value)} className="h-9 text-xs" />
                        </div>
                        <Input type="file" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} className="text-[10px]" />
                      </div>
                    )}
                    <DialogFooter>
                      <Button size="sm" className="bg-[#1e3a8a]" onClick={processUpload} disabled={isUploading || !selectedFile}>አጽድቅ</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <TabsContent value="diagram" className="flex-1 flex flex-col gap-3 m-0 min-h-0">
              <div className="flex-[60] flex flex-col min-h-0 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden relative">
                <div className="absolute top-4 left-4 z-10">
                  <h2 className="text-[10px] font-bold text-[#1e3a8a] uppercase tracking-widest flex items-center bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-100">
                    <Layout className="w-3.5 h-3.5 mr-2" /> የስራ ፍሰት ዲያግራም
                  </h2>
                </div>
                {xmlResult ? (
                  <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-200 uppercase tracking-widest text-[10px] font-black opacity-30">
                    ዲያግራም የለም
                  </div>
                )}
              </div>

              <Separator className="shrink-0" />

              <div className="flex-[40] flex flex-col min-h-0 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                <div className="flex justify-between items-center px-6 py-3 border-b border-slate-50 bg-slate-50/30">
                  <h2 className="text-[10px] font-bold text-[#1e3a8a] uppercase tracking-widest flex items-center">
                    <Database className="w-3.5 h-3.5 mr-2" /> የቢሮ መዝገብ ቤት (DMS)
                  </h2>
                  <Select value={vaultFilter} onValueChange={(val: any) => setVaultFilter(val)}>
                    <SelectTrigger className="h-7 w-40 text-[9px] font-bold">
                      <SelectValue placeholder="ማጣሪያ (Filter)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ሁሉም (All)</SelectItem>
                      <SelectItem value="Plan">እቅድ (Plans)</SelectItem>
                      <SelectItem value="Report">ሪፖርቶች (Reports)</SelectItem>
                      <SelectItem value="Service Taxonomy">Service Taxonomy</SelectItem>
                      <SelectItem value="Reform Documents">የሪፎርም ሰነዶች</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ScrollArea className="flex-1">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="text-[9px] font-bold uppercase px-6">ስም (Title)</TableHead>
                        <TableHead className="text-[9px] font-bold uppercase">ምድብ (Category)</TableHead>
                        <TableHead className="text-[9px] font-bold uppercase">ሁኔታ (Status)</TableHead>
                        <TableHead className="text-[9px] font-bold uppercase">ቀን (Date)</TableHead>
                        <TableHead className="text-right pr-6">ተግባር</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-[10px] text-slate-300 uppercase tracking-widest">መዝገብ ባዶ ነው</TableCell>
                        </TableRow>
                      ) : (
                        filteredDocuments.map(file => (
                          <TableRow key={file.id} className="hover:bg-slate-50/80 transition-colors">
                            <TableCell className="text-[10px] font-bold text-slate-700 px-6">{file.name}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <Badge variant="outline" className="text-[7px] px-1.5 h-3.5 border-slate-200 text-slate-500 uppercase">{file.category}</Badge>
                                <span className="text-[7px] text-slate-400 font-bold ml-1">{file.planType || file.reportType || file.taxonomyService}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-[8px] font-bold text-blue-600"><div className="flex items-center gap-1"><ShieldCheck className="w-2.5 h-2.5" /> Active & Filed</div></TableCell>
                            <TableCell className="text-[9px] text-slate-400">{file.uploadDate}</TableCell>
                            <TableCell className="text-right pr-6">
                              <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="w-3.5 h-3.5" /></Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="dashboard" className="flex-1 p-6 space-y-6 overflow-auto">
              {/* Performance Cards & Charts from previous turn logic */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-slate-50 border-none shadow-none p-4 flex items-center gap-4">
                  <Trophy className="w-8 h-8 text-[#1e3a8a] opacity-20" />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">አማካይ አፈጻጸም</p>
                    <h4 className="text-2xl font-black text-[#1e3a8a]">{avgExecution}%</h4>
                  </div>
                </Card>
                {/* ... other cards ... */}
              </div>
              <Card className="p-6 h-[400px]">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-8">የቢሮው አጠቃላይ አፈጻጸም መግለጫ</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="serviceName" fontSize={10} tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                    <RechartsTooltip />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                    <Bar dataKey="planned" name="ኢላማ" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="actual" name="ውጤት" radius={[4, 4, 0, 0]} barSize={24}>
                      {performanceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="px-8 py-3 bg-white border-t border-slate-100 flex justify-between items-center text-[8px] font-bold uppercase text-slate-400 tracking-[0.2em] shrink-0">
        <div className="flex gap-6">
          <span>ITDB Portal v2.0 - Active Institutional Registry</span>
          <span className="text-[#1e3a8a]/40">© 2024 Innovation and Technology Development Bureau</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          DMS Analytics Engine Live
        </div>
      </footer>
    </div>
  );
}
