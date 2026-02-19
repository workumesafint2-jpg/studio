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
  Archive, 
  Database, 
  ChevronDown, 
  Zap, 
  Activity,
  Loader2,
  Layout,
  Upload,
  Download,
  Target,
  Trophy,
  BarChart,
  Search,
  FileText,
  ShieldCheck,
  BrainCircuit,
  TrendingUp
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
  reformType?: string;
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
  
  const [uploadCategory, setUploadCategory] = useState<string>("");
  const [uploadPlanType, setUploadPlanType] = useState("የዓመት እቅድ (Annual Plan)");
  const [uploadReportType, setUploadReportType] = useState("የወር ሪፖርት (Monthly Report)");
  const [uploadReformType, setUploadReformType] = useState("ካታሎግ (Catalogue)");
  const [uploadTaxonomyService, setUploadTaxonomyService] = useState(BUREAU_SERVICES_REGISTRY[0].title);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [vaultFilter, setVaultFilter] = useState<'all' | 'እቅዶች (Plans)' | 'ሪፖርቶች (Reports)' | 'Service Taxonomy' | 'የሪፎርም ሰነዶች (Reform Docs)'>('all');

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
      
      if (file.category === 'እቅዶች (Plans)') {
        metrics[key].planned = file.metricValue || 100;
      } else if (file.category === 'ሪፖርቶች (Reports)') {
        metrics[key].actual = file.metricValue || 85;
      }
    });

    return Object.entries(metrics)
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

  if (!mounted) return null;

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
        systemCode: `ITDB-2024-${(vault.length + 1).toString().padStart(3, '0')}`,
        title: title || "ያልተሰየመ ሂደት",
        description: input,
        date: new Date().toLocaleString('am-ET'),
        xml: result
      };
      
      setVault(prev => [newDoc, ...prev]);
      toast({ title: "ተሳክቷል", description: `ዲያግራሙ በቮልት (Vault) ውስጥ በኮድ ${newDoc.systemCode} ተመዝግቧል።` });
    }
  };

  const handleAutoSuggest = async (docType: 'reform' | 'report' | 'guideline' | 'diagram' | 'analysis' = 'reform') => {
    if (!title.trim()) {
      toast({ title: "መረጃ የለም", description: "እባክዎን መጀመሪያ የአገልግሎቱን ስም ወይም የፍለጋ ቃል ያስገቡ።", variant: "destructive" });
      return;
    }

    setIsSuggesting(true);
    try {
      const result = await suggestSteps({ 
        title, 
        docType, 
        vaultContext: uploadedFiles 
      });
      
      if (result && result.steps) {
        setInput(result.steps);
        if (result.relatedFiles && result.relatedFiles.length > 0) {
          toast({ 
            title: "ፋይል ተገኝቷል", 
            description: `ተዛማጅ ፋይሎች፡ ${result.relatedFiles.join(', ')}` 
          });
        }
      }
    } catch (error: any) {
      toast({ title: "የ AI ስህተት", description: "መረጃውን ማዘጋጀት አልተቻለም።", variant: "destructive" });
    } finally {
      setIsSuggesting(false);
    }
  };

  const processUpload = () => {
    if (!selectedFile || !uploadCategory) {
      toast({ title: "ስህተት", description: "እባክዎን ፋይል ይምረጡ እና ምድብ ይምረጡ።", variant: "destructive" });
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
            const displayName = selectedFile.name.split('.').slice(0, -1).join('.') || selectedFile.name;

            const newFile: UploadedFile = {
              id: Math.random().toString(36).substr(2, 9),
              name: displayName,
              category: uploadCategory,
              planType: uploadCategory === 'እቅዶች (Plans)' ? uploadPlanType : undefined,
              reportType: uploadCategory === 'ሪፖርቶች (Reports)' ? uploadReportType : undefined,
              reformType: uploadCategory === 'የሪፎርም ሰነዶች (Reform Docs)' ? uploadReformType : undefined,
              taxonomyService: uploadCategory === 'Service Taxonomy' ? uploadTaxonomyService : undefined,
              fileName: selectedFile.name,
              fileSize: (selectedFile.size / 1024).toFixed(1) + " KB",
              uploadDate: new Date().toLocaleString('am-ET'),
              dataUrl,
              type: selectedFile.type,
              metricValue: 0,
              status: 'Active & Filed'
            };

            setUploadedFiles(prev => [newFile, ...prev]);
            setIsUploading(false);
            setIsUploadOpen(false);
            setSelectedFile(null);
            setUploadCategory(""); 
            setUploadProgress(0);
            
            toast({ 
              title: "አግብቷል & ተመዝግቧል", 
              description: `${newFile.name} በቢሮው መዝገብ ቤት ተቀምጧል።`,
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
        <h1 className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.4em]">Institutional Intelligence & DMS Portal</h1>

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
        <div className="w-full shrink-0">
          <Card className="shadow-sm border border-slate-200 rounded-xl overflow-hidden bg-white">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">የአገልግሎት ስም (Service Name)</label>
                  <div className="relative">
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="የአገልግሎት ስም እዚህ ያስገቡ ወይም ይፈልጉ..." className="h-10 text-sm pl-9" />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-end mb-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">የሂደቱን ዝርዝር ተግባር እዚህ ያስገቡ</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-3 text-[9px] text-[#1e3a8a] font-bold border border-[#1e3a8a]/20 rounded-lg bg-blue-50/50">
                          {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <BrainCircuit className="w-3.5 h-3.5 mr-2" />}
                          ወርቁ ነኝ ምን ልርዳዎት? <ChevronDown className="w-2.5 h-2.5 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel className="text-[10px] uppercase text-slate-400">Analysis & Intelligence</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleAutoSuggest('analysis')} className="text-xs font-semibold text-[#1e3a8a]">
                          <FileType className="w-3 h-3 mr-2" /> የፋይል ፍለጋና ትንታኔ
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAutoSuggest('report')} className="text-xs">
                          <BarChart className="w-3 h-3 mr-2" /> የአፈጻጸም ንፅፅር (Plan vs Report)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[10px] uppercase text-slate-400">Workflow Generation</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleAutoSuggest('diagram')} className="text-xs">
                          <Layout className="w-3 h-3 mr-2" /> የዲያግራም ዝርዝር ተግባር
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAutoSuggest('reform')} className="text-xs">
                          <FileType className="w-3 h-3 mr-2" /> የሪፎርም ሰነድ (Reform)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="ዝርዝርን እዚህ ያስገቡ" className="min-h-[120px] text-xs font-medium leading-relaxed" />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 h-11 bg-[#1e3a8a] text-xs font-bold" onClick={handleGenerate}>
                  <Zap className="w-4 h-4 mr-2" /> ዲያግራም አመንጭ (Generate BPMN)
                </Button>
                <Button variant="outline" className="h-11 w-11 p-0 text-slate-400 border-slate-200" onClick={() => { setInput(""); setTitle(""); }}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-auto">
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
                      <DialogTitle className="text-sm font-bold uppercase tracking-widest text-[#1e3a8a]">አዲስ ፋይል አጽድቅ (DMS REGISTRY)</DialogTitle>
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
                          <label className="text-[10px] font-bold text-slate-400">ምድብ (Category)</label>
                          <Select value={uploadCategory} onValueChange={setUploadCategory}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="ምድብ ይምረጡ..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="እቅዶች (Plans)">1. እቅዶች (Plans)</SelectItem>
                              <SelectItem value="ሪፖርቶች (Reports)">2. ሪፖርቶች (Reports)</SelectItem>
                              <SelectItem value="የሪፎርም ሰነዶች (Reform Docs)">3. የሪፎርም ሰነዶች (Reform Docs)</SelectItem>
                              <SelectItem value="Service Taxonomy">4. Service Taxonomy</SelectItem>
                              <SelectItem value="ሌሎች">5. ሌሎች (Others)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {uploadCategory === 'እቅዶች (Plans)' && (
                          <div className="space-y-1.5 animate-in slide-in-from-top-1">
                            <label className="text-[10px] font-bold text-slate-400">የእቅድ ዓይነት (Plan Index)</label>
                            <Select value={uploadPlanType} onValueChange={setUploadPlanType}>
                              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ስትራቴጂካዊ እቅድ">ስትራቴጂካዊ እቅድ</SelectItem>
                                <SelectItem value="የዓመት እቅድ">የዓመት እቅድ</SelectItem>
                                <SelectItem value="የሩብ ዓመት እቅድ">የሩብ ዓመት እቅድ</SelectItem>
                                <SelectItem value="የወር እቅድ">የወር እቅድ</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {uploadCategory === 'ሪፖርቶች (Reports)' && (
                          <div className="space-y-1.5 animate-in slide-in-from-top-1">
                            <label className="text-[10px] font-bold text-slate-400">የሪፖርት ዓይነት (Report Index)</label>
                            <Select value={uploadReportType} onValueChange={setUploadReportType}>
                              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="የወር ሪፖርት">የወር ሪፖርት</SelectItem>
                                <SelectItem value="የሩብ ዓመት ሪፖርት">የሩብ ዓመት ሪፖርት</SelectItem>
                                <SelectItem value="የዓመት አፈጻጸም ሪፖርት">የዓመት አፈጻጸም ሪፖርት</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {uploadCategory === 'የሪፎርም ሰነዶች (Reform Docs)' && (
                          <div className="space-y-1.5 animate-in slide-in-from-top-1">
                            <label className="text-[10px] font-bold text-slate-400">የሪፎርም ሰነድ ዓይነት (Reform Index)</label>
                            <Select value={uploadReformType} onValueChange={setUploadReformType}>
                              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ካታሎግ (Catalogue)">ካታሎግ (Catalogue)</SelectItem>
                                <SelectItem value="Mapping">Mapping</SelectItem>
                                <SelectItem value="As-is">As-is</SelectItem>
                                <SelectItem value="ነባራዊ ትንተና">ነባራዊ ትንተና (Contextual Analysis)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {uploadCategory === 'Service Taxonomy' && (
                          <div className="space-y-1.5 animate-in slide-in-from-top-1">
                            <label className="text-[10px] font-bold text-slate-400">Service Taxonomy Index</label>
                            <Select value={uploadTaxonomyService} onValueChange={setUploadTaxonomyService}>
                              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <ScrollArea className="h-48">
                                  {BUREAU_SERVICES_REGISTRY.map(s => (
                                    <SelectItem key={s.title} value={s.title}>{s.title}</SelectItem>
                                  ))}
                                </ScrollArea>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400">ፋይል ይምረጡ</label>
                          <Input type="file" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} className="text-[10px]" />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button size="sm" className="bg-[#1e3a8a]" onClick={processUpload} disabled={isUploading || !selectedFile || !uploadCategory}>አጽድቅ (Confirm Selection)</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <TabsContent value="diagram" className="flex-1 flex flex-col gap-3 m-0 min-h-0">
              <div className="flex-[60] flex flex-col min-h-[400px] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden relative z-[5]">
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

              <Separator className="shrink-0 h-px bg-slate-200 my-1" />

              <div className="flex-[40] flex flex-col min-h-[300px] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden z-[10]">
                <div className="flex justify-between items-center px-6 py-3 border-b border-slate-50 bg-slate-50/30">
                  <h2 className="text-[10px] font-bold text-[#1e3a8a] uppercase tracking-widest flex items-center">
                    <Database className="w-3.5 h-3.5 mr-2" /> የቢሮ መዝገብ ቤት (DMS)
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ማጣሪያ (FILTER):</span>
                    <Select value={vaultFilter} onValueChange={(val: any) => setVaultFilter(val)}>
                      <SelectTrigger className="h-7 w-40 text-[9px] font-bold bg-white">
                        <SelectValue placeholder="ማጣሪያ (Filter)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ሁሉም (All)</SelectItem>
                        <SelectItem value="እቅዶች (Plans)">እቅዶች (Plans)</SelectItem>
                        <SelectItem value="ሪፖርቶች (Reports)">ሪፖርቶች (Reports)</SelectItem>
                        <SelectItem value="የሪፎርም ሰነዶች (Reform Docs)">የሪፎርም ሰነዶች</SelectItem>
                        <SelectItem value="Service Taxonomy">Service Taxonomy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  <Table>
                    <TableHeader className="bg-slate-50/50 sticky top-0 z-[5]">
                      <TableRow>
                        <TableHead className="text-[9px] font-bold uppercase px-6">ስም (TITLE)</TableHead>
                        <TableHead className="text-[9px] font-bold uppercase">ምድብ (CATEGORY)</TableHead>
                        <TableHead className="text-[9px] font-bold uppercase">ሁኔታ (STATUS)</TableHead>
                        <TableHead className="text-[9px] font-bold uppercase">ቀን (DATE)</TableHead>
                        <TableHead className="text-right pr-6">ተግባር</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-48 text-center text-[10px] text-slate-300 uppercase tracking-widest font-bold">
                            በመዝገብ ቤት ውስጥ የተመዘገበ ሰነድ የለም
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDocuments.map(file => (
                          <TableRow key={file.id} className="hover:bg-slate-50/80 transition-all cursor-default group">
                            <TableCell className="text-[10px] font-bold text-slate-700 px-6">
                              <div className="flex items-center gap-2">
                                <FileText className="w-3 h-3 text-[#1e3a8a] opacity-40" />
                                {file.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <Badge variant="outline" className="text-[7px] px-1.5 h-3.5 border-slate-200 text-slate-500 uppercase font-black bg-white">
                                  {file.category}
                                </Badge>
                                <span className="text-[7px] text-[#1e3a8a] font-bold ml-1 opacity-70 italic">
                                  {file.planType || file.reportType || file.reformType || file.taxonomyService || "General Record"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-[8px] font-bold text-blue-600 bg-blue-50/50 w-fit px-2 py-0.5 rounded-full">
                                <ShieldCheck className="w-2.5 h-2.5" /> 
                                Active & Filed
                              </div>
                            </TableCell>
                            <TableCell className="text-[9px] text-slate-400 font-mono italic">
                              {file.uploadDate}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Download className="w-3.5 h-3.5 text-[#1e3a8a]" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="dashboard" className="flex-1 p-6 space-y-6 overflow-auto bg-white rounded-xl border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-50 border-none shadow-none p-4 flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Trophy className="w-6 h-6 text-[#1e3a8a]" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">አማካይ አፈጻጸም</p>
                    <h4 className="text-2xl font-black text-[#1e3a8a]">{avgExecution}%</h4>
                  </div>
                </Card>
                <Card className="bg-slate-50 border-none shadow-none p-4 flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Target className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">የተመዘገቡ እቅዶች</p>
                    <h4 className="text-2xl font-black text-[#1e3a8a]">
                      {uploadedFiles.filter(f => f.category === 'እቅዶች (Plans)').length}
                    </h4>
                  </div>
                </Card>
                <Card className="bg-slate-50 border-none shadow-none p-4 flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Activity className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">የቀረቡ ሪፖርቶች</p>
                    <h4 className="text-2xl font-black text-[#1e3a8a]">
                      {uploadedFiles.filter(f => f.category === 'ሪፖርቶች (Reports)').length}
                    </h4>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 h-[450px] shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#1e3a8a] flex items-center">
                      <BarChart className="w-4 h-4 mr-2" /> የቢሮው አጠቃላይ አፈጻጸም (Execution Index)
                    </h3>
                    <Badge variant="outline" className="text-[8px] bg-slate-50 border-slate-200">Real-time Analytics</Badge>
                  </div>
                  <ResponsiveContainer width="100%" height="90%">
                    <RechartsBarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="serviceName" fontSize={9} tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                      <YAxis fontSize={9} tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                      <RechartsTooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '20px' }} />
                      <Bar dataKey="planned" name="ኢላማ (Planned)" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="actual" name="ውጤት (Actual)" radius={[4, 4, 0, 0]} barSize={20}>
                        {performanceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6 shadow-sm overflow-hidden flex flex-col">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#1e3a8a] mb-6 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" /> የአገልግሎቶች ዝርዝር አፈጻጸም
                  </h3>
                  <ScrollArea className="flex-1">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="text-[9px] font-bold">አገልግሎት</TableHead>
                          <TableHead className="text-[9px] font-bold">አፈጻጸም</TableHead>
                          <TableHead className="text-[9px] font-bold">ሁኔታ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {performanceData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center h-32 text-[10px] text-slate-300 font-bold uppercase italic">
                              አፈጻጸም ለማየት እቅድና ሪፖርት ያገናኙ
                            </TableCell>
                          </TableRow>
                        ) : (
                          performanceData.map((metric, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-[10px] font-bold">{metric.serviceName}</TableCell>
                              <TableCell className="text-[10px] font-mono">{metric.execution}%</TableCell>
                              <TableCell>
                                <Badge style={{ backgroundColor: metric.color }} className="text-[7px] text-white border-none px-2 h-4">
                                  {metric.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="px-8 py-3 bg-white border-t border-slate-100 flex justify-between items-center text-[8px] font-bold uppercase text-slate-400 tracking-[0.2em] shrink-0">
        <div className="flex gap-6">
          <span>ITDB Portal v2.0 - Institutional Intelligence Live</span>
          <span className="text-[#1e3a8a]/40">© 2024 Innovation and Technology Development Bureau</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          Worqu Assistant Synchronized with DMS
        </div>
      </footer>
    </div>
  );
}
