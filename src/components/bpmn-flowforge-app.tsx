
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
  const [uploadMetric, setUploadMetric] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [vaultFilter, setVaultFilter] = useState<'all' | 'Strategic Plan' | 'Annual Plan' | 'Report' | 'Service Taxonomy' | 'Reform Documents'>('all');

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

  const filteredVault = useMemo(() => {
    if (vaultFilter === 'all') return vault;
    return vault.filter(item => {
        if (vaultFilter === 'Annual Plan' && (item.title.includes('እቅድ') || item.title.includes('Plan'))) return true;
        return false;
    });
  }, [vault, vaultFilter]);

  const filteredDocuments = useMemo(() => {
    if (vaultFilter === 'all') return uploadedFiles;
    return uploadedFiles.filter(item => {
        if (item.category === vaultFilter) return true;
        if (item.planType === vaultFilter) return true;
        if (vaultFilter === 'Report' && item.category === 'Report') return true;
        if (vaultFilter === 'Service Taxonomy' && item.category === 'Service Taxonomy') return true;
        if (vaultFilter === 'Reform Documents' && item.category === 'Reform Documents') return true;
        return false;
    });
  }, [uploadedFiles, vaultFilter]);

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
      
      setVault(prev => {
        if (prev.some(item => item.title === newDoc.title && item.description === newDoc.description)) return prev;
        return [newDoc, ...prev];
      });

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!uploadName) setUploadName(file.name.split('.')[0]);
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
    <div className="flex flex-col h-screen min-h-screen bg-white overflow-hidden">
      {/* Institutional Top Bar */}
      <div className="h-1 w-full bg-[#1e3a8a] shrink-0 sticky top-0 z-[100]" />
      
      <header className="flex flex-col items-center justify-center py-3 px-8 bg-white border-b border-slate-100 shrink-0 sticky top-1 z-[99] relative text-center">
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

      {/* Main Content Area: Locked Split View */}
      <main className="flex flex-col flex-1 p-3 gap-3 bg-slate-50/50 overflow-hidden">
        
        {/* Top Control Section: Service Input */}
        <div className="w-full shrink-0 flex flex-col lg:flex-row gap-3">
          <Card className="flex-1 shadow-sm border border-slate-200 rounded-xl overflow-hidden bg-white">
            <CardContent className="p-4 flex flex-col lg:flex-row gap-4">
              <div className="flex-1 space-y-3">
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
                <div className="flex gap-2">
                  <Button className="flex-1 h-10 rounded-lg bg-[#1e3a8a] text-white" onClick={handleGenerate}>
                    <Zap className="w-3.5 h-3.5 mr-2" /> አመንጭ
                  </Button>
                  <Button variant="outline" className="h-10 w-10 p-0 rounded-lg text-slate-400" onClick={() => { setInput(""); setTitle(""); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-[2] relative flex flex-col">
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
                      <DropdownMenuItem onClick={() => handleAutoSuggest('reform')} className="text-xs">የሪፎርም ሰነድ (Reform)</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAutoSuggest('report')} className="text-xs">ቴክኒካዊ ሪፖርት</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAutoSuggest('guideline')} className="text-xs">የአሰራር መመሪያ</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="የሂደቱን ዝርዝር እዚህ ይግለጹ..."
                  className="flex-1 resize-none bg-slate-50 border-slate-100 rounded-lg text-xs min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 60/40 Split View Workspace */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 relative">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col w-full h-full min-h-0">
            <div className="flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm shrink-0 sticky top-0 z-[50]">
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
                      <DialogTitle className="text-sm font-bold uppercase tracking-widest text-[#1e3a8a]">አዲስ ፋይል አጽድቅ (Parsing Active)</DialogTitle>
                      <DialogDescription className="text-xs">በቢሮው መዝገብ ቤት (DMS) ውስጥ ለማስቀመጥ የፈለጉትን ፋይል እዚህ ይስቀሉ።</DialogDescription>
                    </DialogHeader>
                    {isUploading ? (
                      <div className="py-8 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-primary animate-pulse">ፋይሉን በመተንተን ላይ (Processing Document)...</span>
                          <span className="text-xs font-mono">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2 bg-slate-100" />
                        <p className="text-[10px] text-slate-400 text-center">እባክዎን ይጠብቁ፣ ሰነዱ በቮልት (Vault) ውስጥ እየተመዘገበ ነው።</p>
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
                              <Select value={uploadCategory} onValueChange={(val) => setUploadCategory(val)}>
                                <SelectTrigger className="h-9 text-xs">
                                  <SelectValue placeholder="ምድብ ይምረጡ" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Plan">እቅድ (Plan)</SelectItem>
                                  <SelectItem value="Report">ሪፖርት (Report)</SelectItem>
                                  <SelectItem value="Service Taxonomy">Service Taxonomy</SelectItem>
                                  <SelectItem value="Reform Documents">የሪፎርም ሰነዶች (Reform)</SelectItem>
                                  <SelectItem value="Other">ሌሎች (Other)</SelectItem>
                                </SelectContent>
                              </Select>
                          </div>
                          {uploadCategory === 'Plan' && (
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-400">የእቅድ ዓይነት (Plan Index)</label>
                                  <Select value={uploadPlanType} onValueChange={setUploadPlanType}>
                                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="የእቅድ ዓይነት" /></SelectTrigger>
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
                                  <label className="text-[10px] font-bold text-slate-400">የሪፖርት ዓይነት (Report Index)</label>
                                  <Select value={uploadReportType} onValueChange={setUploadReportType}>
                                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="የሪፖርት ዓይነት" /></SelectTrigger>
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
                    )}
                    <DialogFooter>
                      <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>ሰርዝ</Button>
                      <Button size="sm" className="bg-[#1e3a8a]" onClick={processUpload} disabled={isUploading || !selectedFile}>
                        {isUploading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Archive className="w-3 h-3 mr-2" />}
                        አጽድቅ
                      </Button>
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

            <TabsContent value="diagram" className="flex-1 flex flex-col gap-3 m-0 p-0 overflow-hidden relative">
              
              {/* 1. Workflow Diagram Area (60%) */}
              <div className="flex-[60] flex flex-col gap-2 relative z-5 min-h-0">
                <div className="flex justify-between items-center px-1">
                  <h2 className="text-[11px] font-bold text-[#1e3a8a] uppercase tracking-widest flex items-center">
                    <Layout className="w-4 h-4 mr-2" /> የስራ ፍሰት ዲያግራም (Workflow Diagram)
                  </h2>
                  <Badge variant="outline" className="text-[8px] bg-white border-slate-200">Interactive Modeler Active</Badge>
                </div>
                <div className="flex-1 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden relative">
                  {xmlResult ? (
                    <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                      <Layout className="w-16 h-16 opacity-10" />
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">የጸደቀ ሪፎርም የለም</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-slate-300 h-0.5 my-1 shadow-sm shrink-0" />

              {/* 2. Bureau Vault (DMS) Area (40%) */}
              <div className="flex-[40] flex flex-col gap-2 relative z-10 bg-slate-50/50 p-4 rounded-xl border border-slate-200 overflow-hidden min-h-0">
                <div className="flex justify-between items-center px-1 shrink-0">
                  <div className="flex items-center gap-4">
                      <h2 className="text-[11px] font-bold text-[#1e3a8a] uppercase tracking-widest flex items-center">
                        <Database className="w-4 h-4 mr-2" /> የቢሮ መዝገብ ቤት (DMS) - የሰነዶች መዝገብ
                      </h2>
                      <Badge variant="secondary" className="bg-[#1e3a8a]/10 text-[#1e3a8a] text-[9px] border-none">Active Institutional Registry</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-[9px] font-bold rounded-lg border-slate-200 bg-white shadow-sm">
                          <Filter className="w-3 h-3 mr-1" /> ምድብ ይምረጡ: {vaultFilter === 'all' ? 'ሁሉም' : vaultFilter}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setVaultFilter('all')} className="text-xs">ሁሉም (All)</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[10px] uppercase text-slate-400">የሰነድ ማህደር</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setVaultFilter('Strategic Plan')} className="text-xs">ስትራቴጂካዊ እቅድ</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setVaultFilter('Annual Plan')} className="text-xs">የዓመት እቅድ</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setVaultFilter('Report')} className="text-xs">ሪፖርት (Reports)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setVaultFilter('Service Taxonomy')} className="text-xs">Service Taxonomy</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setVaultFilter('Reform Documents')} className="text-xs">የሪፎርም ሰነዶች</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <Card className="flex-1 shadow-md border border-slate-200 rounded-xl overflow-hidden bg-white relative">
                  <ScrollArea className="h-full">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white/95 z-[20] shadow-sm">
                        <TableRow className="bg-slate-50/50">
                          <TableHead className="text-[9px] uppercase h-10 px-6 font-bold text-slate-500">ስም (Title)</TableHead>
                          <TableHead className="text-[9px] uppercase h-10 font-bold text-slate-500">ምድብ / የእቅድ ዓይነት</TableHead>
                          <TableHead className="text-[9px] uppercase h-10 font-bold text-slate-500">ሁኔታ (Status)</TableHead>
                          <TableHead className="text-[9px] uppercase h-10 font-bold text-slate-500">ኢላማ/ውጤት</TableHead>
                          <TableHead className="text-[9px] uppercase h-10 font-bold text-slate-500">ቀን (Date)</TableHead>
                          <TableHead className="text-[9px] uppercase h-10 text-right pr-6 font-bold text-slate-500">ተግባር</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(filteredVault.length === 0 && filteredDocuments.length === 0) ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-40 text-center text-[10px] text-slate-300 uppercase tracking-widest font-black">
                              <Archive className="w-12 h-12 mx-auto mb-2 opacity-10" />
                              መዝገብ ባዶ ነው
                            </TableCell>
                          </TableRow>
                        ) : (
                          <>
                            {filteredVault.map((doc) => (
                              <TableRow key={doc.id} className="group hover:bg-slate-50/80 transition-all cursor-pointer" onClick={() => { setXmlResult(doc.xml); setTitle(doc.title); setInput(doc.description); setActiveTab("diagram"); }}>
                                <TableCell className="text-[10px] font-bold py-3 px-6 text-[#1e3a8a]">{doc.title}</TableCell>
                                <TableCell className="py-3"><Badge variant="outline" className="text-[8px] h-4 px-2 border-[#1e3a8a]/20 text-[#1e3a8a]">ዲያግራም</Badge></TableCell>
                                <TableCell className="py-3"><div className="flex items-center gap-1.5 text-[8px] font-bold text-green-600"><ShieldCheck className="w-2.5 h-2.5" /> Active & Filed</div></TableCell>
                                <TableCell className="text-[10px] text-slate-400 py-3">-</TableCell>
                                <TableCell className="text-[10px] text-slate-400 py-3">{doc.date}</TableCell>
                                <TableCell className="text-right py-3 pr-6">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 group-hover:text-[#1e3a8a]">
                                    <FileSearch className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {filteredDocuments.map((file) => (
                              <TableRow key={file.id} className="group hover:bg-slate-50/80 transition-all">
                                <TableCell className="text-[10px] font-bold py-3 px-6 text-slate-700">{file.name}</TableCell>
                                <TableCell className="py-3">
                                  <div className="flex flex-col gap-1">
                                      <Badge variant="secondary" className={`text-[8px] h-4 px-2 w-fit ${file.category === 'Plan' ? 'bg-[#1e3a8a] text-white' : 'bg-slate-100 text-slate-600'}`}>{file.category}</Badge>
                                      {(file.planType || file.reportType) && <span className="text-[8px] font-bold text-slate-400 ml-1">↳ {file.planType || file.reportType}</span>}
                                  </div>
                                </TableCell>
                                <TableCell className="py-3"><div className="flex items-center gap-1.5 text-[8px] font-bold text-blue-600"><Clock className="w-2.5 h-2.5" /> {file.status}</div></TableCell>
                                <TableCell className="text-[10px] font-mono text-slate-500 py-3">{file.metricValue}</TableCell>
                                <TableCell className="text-[10px] text-slate-400 py-3">{file.uploadDate}</TableCell>
                                <TableCell className="text-right py-3 pr-6">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 group-hover:text-primary" onClick={() => handleDownloadFile(file)}>
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </Card>
              </div>
            </TabsContent>

            {/* Performance Dashboard View */}
            <TabsContent value="dashboard" className="flex-1 m-0 p-6 bg-white rounded-xl border border-slate-200 overflow-auto flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <Card className="bg-slate-50/50 border-slate-100 shadow-none">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-[#1e3a8a]/10 rounded-xl"><Trophy className="w-6 h-6 text-[#1e3a8a]" /></div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">አማካይ አፈጻጸም (Avg Execution)</p>
                      <h4 className="text-2xl font-black text-[#1e3a8a]">{avgExecution}%</h4>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50/50 border-slate-100 shadow-none">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-xl"><Target className="w-6 h-6 text-green-600" /></div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ተጠናቀቁ አገልግሎቶች</p>
                      <h4 className="text-2xl font-black text-green-600">{performanceData.filter(d => d.execution >= 90).length}</h4>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50/50 border-slate-100 shadow-none">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-xl"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ልዩ ክትትል የሚሹ</p>
                      <h4 className="text-2xl font-black text-red-600">{performanceData.filter(d => d.execution < 50).length}</h4>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="flex-1 shadow-none border-slate-100 overflow-hidden min-h-[400px]">
                <CardContent className="p-4 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-[0.2em] flex items-center">
                      <BarChart className="w-5 h-5 mr-2 text-primary" /> የቢሮው አጠቃላይ አፈጻጸም መግለጫ (Performance Overview)
                    </h3>
                  </div>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="serviceName" 
                          fontSize={11} 
                          fontWeight={700} 
                          tick={{ fill: '#64748b' }} 
                          axisLine={false} 
                          tickLine={false}
                        />
                        <YAxis 
                          fontSize={11} 
                          fontWeight={700} 
                          tick={{ fill: '#64748b' }} 
                          axisLine={false} 
                          tickLine={false}
                        />
                        <RechartsTooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                          formatter={(value, name, props) => [value, `${name} (${props.payload.period})`]}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '20px' }} />
                        <Bar dataKey="planned" name="ኢላማ (Target)" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={32} />
                        <Bar dataKey="actual" name="ውጤት (Actual)" radius={[6, 6, 0, 0]} barSize={32}>
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
          </Tabs>
        </div>
      </main>
      
      {/* Institutional Footer */}
      <footer className="px-8 py-3 bg-white border-t border-slate-100 flex justify-between items-center text-[8px] font-bold uppercase text-slate-400 tracking-[0.2em] shrink-0 sticky bottom-0 z-[100]">
        <div className="flex gap-6">
          <span>ITDB Portal v2.0 - Active Institutional Registry</span>
          <span className="text-[#1e3a8a]/40">© 2024 Innovation and Technology Development Bureau</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> DMS Analytics Engine Live</span>
        </div>
      </footer>
    </div>
  );
}
