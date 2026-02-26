
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Trash2, 
  MoreVertical, 
  Search,
  Loader2,
  Upload,
  Download,
  Target,
  Trophy,
  BarChart,
  FileText,
  ShieldCheck,
  BrainCircuit,
  TrendingUp,
  Image as ImageIcon,
  Bell,
  CheckCircle2,
  Save,
  FileCode,
  ChevronDown,
  Activity,
  Layout as LayoutIcon
} from "lucide-react";
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
import { 
  Bar, 
  BarChart as RechartsBarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { BUREAU_SERVICES_REGISTRY } from '@/lib/services-registry';
import { 
  useCollection, 
  useUser, 
  useFirestore, 
  useAuth, 
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking,
  initiateAnonymousSignIn
} from '@/firebase';
import { collection, query, where, doc, Timestamp } from 'firebase/firestore';

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
  status: 'የጸደቀ' | 'በሂደት ላይ';
  version: number;
  uploaderId: string;
  createdAt?: any;
}

interface PerformanceMetric {
  serviceName: string;
  planned: number;
  actual: number;
  execution: number;
  color: string;
}

export function BPMNFlowForgeApp() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [xmlResult, setXmlResult] = useState("");
  const [activeTab, setActiveTab] = useState("diagram");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  
  const [uploadCategory, setUploadCategory] = useState<string>("");
  const [uploadPlanType, setUploadPlanType] = useState("");
  const [uploadReportType, setUploadReportType] = useState("");
  const [uploadReformType, setUploadReformType] = useState("");
  const [uploadTaxonomyService, setUploadTaxonomyService] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [vaultFilter, setVaultFilter] = useState<'all' | 'እቅዶች (Plans)' | 'ሪፖርቶች (Reports)' | 'Service Taxonomy' | 'የሪፎርም ሰነዶች (Reform Docs)'>('all');

  const viewerRef = useRef<BPMNViewerRef>(null);
  const { toast } = useToast();
  
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();

  useEffect(() => {
    setMounted(true);
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  const documentsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'documents'), where('uploaderId', '==', user.uid));
  }, [db, user]);

  const { data: uploadedFilesRaw, isLoading: isDocsLoading } = useCollection<UploadedFile>(documentsQuery);
  const uploadedFiles = uploadedFilesRaw || [];

  const performanceData = useMemo(() => {
    const metrics: Record<string, { planned: number; actual: number }> = {};
    
    uploadedFiles.forEach(file => {
      const name = file.name.split(' V')[0]; 
      if (!metrics[name]) metrics[name] = { planned: 0, actual: 0 };
      
      if (file.category === 'እቅዶች (Plans)') metrics[name].planned = 100;
      else if (file.category === 'ሪፖርቶች (Reports)') metrics[name].actual = 85;
    });

    return Object.entries(metrics).map(([name, data]) => {
      const execution = data.planned > 0 ? (data.actual / data.planned) * 100 : 0;
      return {
        serviceName: name,
        planned: data.planned,
        actual: data.actual,
        execution: Math.round(execution),
        color: execution >= 90 ? '#22c55e' : execution >= 50 ? '#eab308' : '#ef4444'
      } as PerformanceMetric;
    }).slice(0, 5);
  }, [uploadedFiles]);

  const todayCount = useMemo(() => {
    const today = new Date().toLocaleDateString('am-ET');
    return uploadedFiles.filter(f => f.uploadDate.includes(today)).length;
  }, [uploadedFiles]);

  const stats = useMemo(() => ({
    totalPlans: uploadedFiles.filter(f => f.category === 'እቅዶች (Plans)').length,
    totalReports: uploadedFiles.filter(f => f.category === 'ሪፖርቶች (Reports)').length,
    avgExecution: performanceData.length > 0 
      ? Math.round(performanceData.reduce((acc, curr) => acc + curr.execution, 0) / performanceData.length)
      : 0
  }), [uploadedFiles, performanceData]);

  const filteredDocuments = useMemo(() => {
    let list = uploadedFiles;
    if (vaultFilter !== 'all') {
      list = list.filter(item => item.category === vaultFilter);
    }
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.category.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q)
      );
    }
    return list;
  }, [uploadedFiles, vaultFilter, globalSearch]);

  if (!mounted) return null;

  const handleGenerate = () => {
    if (!input.trim()) {
      toast({ title: "መረጃ የለም", description: "እባክዎን የሂደቱን ዝርዝር ተግባር ያስገቡ።", variant: "destructive" });
      return;
    }
    const result = generateBPMN(input, title || "የሂደት ዲያግራም");
    if (result) {
      setXmlResult(result);
      setActiveTab("diagram");
      toast({ title: "ተሳክቷል", description: "ዲያግራሙ በአሁኑ ሰርክ ውስጥ ተዘጋጅቷል።" });
    }
  };

  /**
   * Helper function to robustly encode Unicode strings (like Amharic XML) to Base64.
   */
  const toUnicodeBase64 = (str: string) => {
    const bytes = new TextEncoder().encode(str);
    let binString = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binString += String.fromCharCode(bytes[i]);
    }
    return btoa(binString);
  };

  const handleSaveToVault = async () => {
    const currentXml = await viewerRef.current?.getXML() || xmlResult;
    
    if (!currentXml) {
      toast({ title: "መረጃ የለም", description: "የሚቀመጥ ዲያግራም የለም።", variant: "destructive" });
      return;
    }

    if (!db) {
      toast({ 
        title: "Cloud Sync Disabled", 
        description: "የቢሮው የደመና መዝገብ ቤት አልነቃም። እባክዎን የሲስተም አድሚን ያነጋግሩ።", 
        variant: "destructive" 
      });
      return;
    }

    if (isUserLoading || !user) {
      toast({ 
        title: "የተጠቃሚ መታወቂያ", 
        description: "ሲስተሙ መታወቂያዎን እያረጋገጠ ነው። እባክዎን ሰከንዶች ይጠብቁ...", 
      });
      return;
    }

    setIsSaving(true);
    try {
      const docName = title || "ያልተሰየመ ዲያግራም";
      
      // Robust Unicode Base64 encoding for Amharic characters
      const encodedData = toUnicodeBase64(currentXml);
      
      const newFile: Omit<UploadedFile, 'id'> = {
        name: docName,
        category: 'የሪፎርም ሰነዶች (Reform Docs)',
        reformType: "Mapping",
        fileName: `${docName.replace(/\s+/g, '-')}.bpmn`,
        fileSize: (new Blob([currentXml]).size / 1024).toFixed(1) + " KB",
        uploadDate: new Date().toLocaleString('am-ET'),
        dataUrl: `data:application/xml;base64,${encodedData}`,
        type: 'application/xml',
        status: 'በሂደት ላይ',
        version: 1,
        uploaderId: user.uid,
        createdAt: Timestamp.now()
      };

      await addDocumentNonBlocking(collection(db, 'documents'), newFile);
      toast({ title: "ተቀምጧል", description: "ዲያግራሙ በመዝገብ ቤት ተመዝግቧል።" });
    } catch (err: any) {
      console.error("Institutional Sync Save Error:", err);
      toast({ 
        title: "ስህተት", 
        description: `ዲያግራሙን ማስቀመጥ አልተቻለም። እባክዎን እንደገና ይሞክሩ።`, 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoSuggest = async (docType: 'reform' | 'report' | 'guideline' | 'diagram' | 'analysis' = 'reform') => {
    setIsSuggesting(true);
    try {
      const result = await suggestSteps({ 
        title: title || "General Inquiry", 
        docType, 
        vaultContext: uploadedFiles 
      });
      if (result && result.steps) {
        setInput(result.steps);
        toast({ title: "ወርቁ ትንተና", description: "የመዝገብ ቤት መረጃ ተሰናድቷል።" });
      }
    } catch (error: any) {
      toast({ title: "ስህተት", description: "መረጃውን ማግኘት አልተቻለም።", variant: "destructive" });
    } finally {
      setIsSuggesting(false);
    }
  };

  const processUpload = () => {
    if (!selectedFile || !uploadCategory || !user || !db) {
      toast({ title: "ስህተት", description: "እባክዎን ፋይልና ምድብ ይምረጡ።", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dataUrl = e.target?.result as string;
        const displayName = selectedFile.name.split('.').slice(0, -1).join('.') || selectedFile.name;
        const existingVersions = uploadedFiles.filter(f => f.name.startsWith(displayName));
        const version = existingVersions.length + 1;
        const finalName = version > 1 ? `${displayName} V${version}` : displayName;

        const newFile: Omit<UploadedFile, 'id'> = {
          name: finalName,
          category: uploadCategory,
          planType: (uploadCategory === 'እቅዶች (Plans)' && uploadPlanType) ? uploadPlanType : "",
          reportType: (uploadCategory === 'ሪፖርቶች (Reports)' && uploadReportType) ? uploadReportType : "",
          reformType: (uploadCategory === 'የሪፎርም ሰነዶች (Reform Docs)' && uploadReformType) ? uploadReformType : "",
          taxonomyService: (uploadCategory === 'Service Taxonomy' && uploadTaxonomyService) ? uploadTaxonomyService : "",
          fileName: selectedFile.name,
          fileSize: (selectedFile.size / 1024).toFixed(1) + " KB",
          uploadDate: new Date().toLocaleString('am-ET'),
          dataUrl,
          type: selectedFile.type,
          status: 'በሂደት ላይ',
          version,
          uploaderId: user.uid,
          createdAt: Timestamp.now()
        };

        addDocumentNonBlocking(collection(db, 'documents'), newFile);
        setIsUploading(false);
        setIsUploadOpen(false);
        setSelectedFile(null);
        setUploadPlanType("");
        setUploadReportType("");
        setUploadReformType("");
        setUploadTaxonomyService("");
        toast({ title: "አግብቷል", description: `${newFile.name} በመዝገብ ቤት ተቀምጧል።` });
      } catch (err) {
        console.error("Upload Error:", err);
        setIsUploading(false);
        toast({ title: "ስህተት", description: "ፋይሉን መመዝገብ አልተቻለም።", variant: "destructive" });
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast({ title: "ስህተት", description: "ፋይሉን ማንበብ አልተቻለም።", variant: "destructive" });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleApprove = (docId: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'documents', docId), { status: 'የጸደቀ' });
    toast({ title: "ተሳክቷል", description: "ሰነዱ በቢሮው ጸድቋል።" });
  };

  const handleDelete = (docId: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'documents', docId));
    toast({ title: "ተሰርዟል", description: "ሰነዱ ከመዝገብ ቤት ተወግዷል።" });
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden font-body">
      <div className="h-1 w-full bg-primary shrink-0" />
      
      <header className="flex items-center justify-between py-3 px-8 bg-white border-b border-slate-100 shrink-0 sticky top-0 z-[100]">
        <div className="flex flex-col">
          <p className="text-[10px] font-bold text-primary mb-0.5 tracking-widest uppercase">ኢኖቬሽንና ቴክኖሎጂ ልልማት ቢሮ</p>
          <h1 className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.4em]">ITDB Institutional Portal</h1>
        </div>

        <div className="flex items-center gap-4 max-w-md w-full mx-8">
          <div className="relative w-full">
            <Input value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="በስም፣ በምድብ ወይም በሁኔታ ፈልግ..." className="h-8 text-[10px] pl-8 bg-slate-50 border-none rounded-lg" />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative mr-2">
            <Bell className="w-5 h-5 text-slate-400" />
            {todayCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                {todayCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg border border-slate-200">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-[200]">
                <DropdownMenuLabel className="text-[9px] uppercase tracking-widest text-slate-400">ኤክስፖርት አማራጮች</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => viewerRef.current?.exportXML()} className="text-xs">
                  <FileCode className="w-3.5 h-3.5 mr-2 text-primary" /> Export BPMN (.bpmn)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => viewerRef.current?.exportSVG()} className="text-xs">
                  <ImageIcon className="w-3.5 h-3.5 mr-2 text-green-600" /> Export SVG (.svg)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex flex-col flex-1 p-3 gap-3 bg-slate-50/50 overflow-hidden">
        <div className="w-full shrink-0">
          <Card className="shadow-sm border border-slate-200 rounded-xl overflow-hidden bg-white">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">የአገልግሎት ስም</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="የአገልግሎት ስም እዚህ ያስገቡ..." className="h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-end mb-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">የሂደቱን ዝርዝር ተግባር</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-3 text-[9px] text-primary font-bold border border-primary/20 rounded-lg bg-accent/30">
                          {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <BrainCircuit className="w-3.5 h-3.5 mr-2" />}
                          ወርቁ ነኝ ምን ልርዳዎት? <ChevronDown className="w-2.5 h-2.5 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 z-[200]">
                        <DropdownMenuItem onClick={() => handleAutoSuggest('analysis')} className="text-xs font-semibold text-primary">
                          <FileText className="w-3 h-3 mr-2" /> የፋይል ፍለጋና ትንታኔ
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAutoSuggest('report')} className="text-xs font-semibold text-green-600">
                          <TrendingUp className="w-3 h-3 mr-2" /> እቅድና ሪፖርቱን አነጻጽሪ (Gap Analysis)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAutoSuggest('diagram')} className="text-xs">
                          <LayoutIcon className="w-3 h-3 mr-2" /> የስራ ፍሰት ዝርዝር አመንጭ
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="ዝርዝርን እዚህ ያስገቡ" className="min-h-[100px] text-xs leading-relaxed" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-[3] h-11 bg-primary text-primary-foreground text-xs font-bold" onClick={handleGenerate}>ዲያግራም አመንጭ</Button>
                <Button variant="outline" className="flex-1 h-11 text-xs font-bold border-primary text-primary hover:bg-accent/30" onClick={handleSaveToVault} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  መዝግብ (Save)
                </Button>
                <Button variant="outline" className="h-11 px-4 border-slate-200" onClick={() => { setInput(""); setTitle(""); }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col w-full h-full min-h-0">
            <div className="flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <TabsList className="bg-slate-50 h-8 p-1">
                <TabsTrigger value="diagram" className="text-[10px] px-4">ዲያግራም</TabsTrigger>
                <TabsTrigger value="dashboard" className="text-[10px] px-4">የቢሮው አፈጻጸም</TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 text-[9px] text-primary font-bold border border-primary/20 rounded-lg">
                      <Upload className="w-3 h-3 mr-2" /> አዲስ ፋይል አጽድቅ (DMS)
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md p-8 gap-8">
                    <DialogHeader>
                      <DialogTitle className="text-base font-bold uppercase text-primary">ፋይል መመዝገቢያ</DialogTitle>
                      <DialogDescription className="text-xs text-slate-500">እባክዎን ፋይሉን በቢሮው ምደባ መሰረት ይመዝግቡ።</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">1. ዋና ምድብ</label>
                        <Select value={uploadCategory} onValueChange={(val) => {
                          setUploadCategory(val);
                          setUploadPlanType("");
                          setUploadReportType("");
                          setUploadReformType("");
                          setUploadTaxonomyService("");
                        }}>
                          <SelectTrigger className="h-10 text-xs shadow-sm"><SelectValue placeholder="ምድብ ይምረጡ..." /></SelectTrigger>
                          <SelectContent className="z-[1100]">
                            <SelectItem value="እቅዶች (Plans)">1. እቅዶች (Plans)</SelectItem>
                            <SelectItem value="ሪፖርቶች (Reports)">2. ሪፖርቶች (Reports)</SelectItem>
                            <SelectItem value="የሪፎርም ሰነዶች (Reform Docs)">3. የሪፎርም ሰነዶች (Reform)</SelectItem>
                            <SelectItem value="Service Taxonomy">4. Service Taxonomy</SelectItem>
                            <SelectItem value="ሌሎች">5. ሌሎች (Others)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {uploadCategory === "እቅዶች (Plans)" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                          <label className="text-[10px] font-bold text-primary uppercase tracking-widest">2. የእቅድ አይነት</label>
                          <Select value={uploadPlanType} onValueChange={setUploadPlanType}>
                            <SelectTrigger className="h-10 text-xs border-primary/30 shadow-sm"><SelectValue placeholder="የእቅድ አይነት ይምረጡ..." /></SelectTrigger>
                            <SelectContent className="z-[1100]">
                              <SelectItem value="ስትራቴጂካዊ">ስትራቴጂካዊ እቅድ</SelectItem>
                              <SelectItem value="የዓመት">የዓመት እቅድ</SelectItem>
                              <SelectItem value="የሩብ ዓመት">የሩብ ዓመት እቅድ</SelectItem>
                              <SelectItem value="የወር">የወር እቅድ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {uploadCategory === "ሪፖርቶች (Reports)" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                          <label className="text-[10px] font-bold text-green-600 uppercase tracking-widest">2. የሪፖርት አይነት</label>
                          <Select value={uploadReportType} onValueChange={setUploadReportType}>
                            <SelectTrigger className="h-10 text-xs border-green-600/30 shadow-sm"><SelectValue placeholder="የሪፖርት አይነት ይምረጡ..." /></SelectTrigger>
                            <SelectContent className="z-[1100]">
                              <SelectItem value="የወር">የወር ሪፖርት</SelectItem>
                              <SelectItem value="የሩብ ዓመት">የሩብ ዓመት ሪፖርት</SelectItem>
                              <SelectItem value="የዓመት">የዓመት ሪፖርት</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {uploadCategory === "የሪፎርም ሰነዶች (Reform Docs)" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                          <label className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">2. የሪፎርም አይነት</label>
                          <Select value={uploadReformType} onValueChange={setUploadReformType}>
                            <SelectTrigger className="h-10 text-xs border-amber-600/30 shadow-sm"><SelectValue placeholder="የሪፎርም አይነት ይምረጡ..." /></SelectTrigger>
                            <SelectContent className="z-[1100]">
                              <SelectItem value="ካታሎግ">ካታሎግ (Catalogue)</SelectItem>
                              <SelectItem value="Mapping">Mapping</SelectItem>
                              <SelectItem value="As-is">As-is Process</SelectItem>
                              <SelectItem value="ነባራዊ ትንተና">ነባራዊ ትንተና</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {uploadCategory === "Service Taxonomy" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">2. የአገልግሎት ዝርዝር</label>
                          <Select value={uploadTaxonomyService} onValueChange={setUploadTaxonomyService}>
                            <SelectTrigger className="h-10 text-xs border-slate-600/30 shadow-sm"><SelectValue placeholder="አገልግሎት ይምረጡ..." /></SelectTrigger>
                            <SelectContent className="z-[1100] max-h-[200px]">
                              {BUREAU_SERVICES_REGISTRY.map((s, i) => (
                                <SelectItem key={i} value={s.title}>{s.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2 pt-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">3. ፋይል ይምረጡ</label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-6 h-6 mb-2 text-slate-400" />
                              <p className="text-[10px] text-slate-500 font-semibold">{selectedFile ? selectedFile.name : 'Choose File'}</p>
                            </div>
                            <input type="file" className="hidden" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
                          </label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="mt-2">
                      <Button size="lg" className="bg-primary text-primary-foreground w-full h-12 text-sm font-bold shadow-md hover:bg-primary/90" onClick={processUpload} disabled={isUploading || !selectedFile || !uploadCategory}>
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                        አጽድቅና መዝግብ
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <TabsContent value="diagram" className="flex-1 flex flex-col gap-3 m-0 min-h-0">
              <div className="flex-[60] flex flex-col min-h-[350px] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden relative">
                {xmlResult ? <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} /> : <div className="h-full flex items-center justify-center text-slate-200 text-[10px] font-black opacity-30">ዲያግራም የለም</div>}
              </div>

              <div className="flex-[40] flex flex-col min-h-[300px] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50/30 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                    <Target className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">እቅዶች</p>
                      <h4 className="text-lg font-black text-primary">{stats.totalPlans}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                    <Activity className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">ሪፖርቶች</p>
                      <h4 className="text-lg font-black text-primary">{stats.totalReports}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">አማካይ አፈጻጸም</p>
                      <h4 className="text-lg font-black text-primary">{stats.avgExecution}%</h4>
                    </div>
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  <Table>
                    <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="text-[9px] font-bold uppercase px-6">ስም</TableHead>
                        <TableHead className="text-[9px] font-bold uppercase">ምድብ</TableHead>
                        <TableHead className="text-[9px] font-bold uppercase">ሁኔታ</TableHead>
                        <TableHead className="text-[9px] font-bold uppercase">ቀን</TableHead>
                        <TableHead className="text-right pr-6">ተግባር</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isDocsLoading ? (
                        <TableRow><TableCell colSpan={5} className="h-32 text-center text-[10px] text-slate-300 uppercase font-bold tracking-widest"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> በመጫን ላይ...</TableCell></TableRow>
                      ) : filteredDocuments.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-32 text-center text-[10px] text-slate-300 uppercase font-bold tracking-widest">መዝገብ ቤት ባዶ ነው</TableCell></TableRow>
                      ) : (
                        filteredDocuments.map(file => (
                          <TableRow key={file.id} className="hover:bg-slate-50/80 transition-all group">
                            <TableCell className="text-[10px] font-bold px-6">
                              <div className="flex flex-col">
                                <span>{file.name}</span>
                                <span className="text-[8px] text-slate-400 font-mono">Ver {file.version}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <Badge variant="outline" className="text-[7px] px-1.5 h-3.5 bg-white w-fit">{file.category}</Badge>
                                {(file.planType || file.reportType || file.reformType || file.taxonomyService) && (
                                  <span className="text-[7px] text-slate-400 italic">
                                    {file.planType || file.reportType || file.reformType || file.taxonomyService}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-[8px] border-none h-4 ${file.status === 'የጸደቀ' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {file.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-[9px] text-slate-400 italic">{file.uploadDate}</TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {file.status !== 'የጸደቀ' && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => handleApprove(file.id)} title="አጽድቅ">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" asChild title="አውርድ">
                                  <a href={file.dataUrl} download={file.fileName}><Download className="w-3.5 h-3.5" /></a>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(file.id)} title="ሰርዝ">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 h-[400px] shadow-sm">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-8 flex items-center"><BarChart className="w-4 h-4 mr-2" /> የቢሮው አጠቃላይ አፈጻጸም</h3>
                  <ResponsiveContainer width="100%" height="80%">
                    <RechartsBarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="serviceName" fontSize={9} axisLine={false} tickLine={false} />
                      <YAxis fontSize={9} axisLine={false} tickLine={false} />
                      <RechartsTooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                      <Bar dataKey="planned" name="ኢላማ" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="actual" name="ውጤት" radius={[4, 4, 0, 0]} barSize={20}>
                        {performanceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6 shadow-sm overflow-hidden flex flex-col">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-6 flex items-center"><TrendingUp className="w-4 h-4 mr-2" /> ዝርዝር አፈጻጸም ሪፖርት</h3>
                  <ScrollArea className="flex-1">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="text-[9px] font-bold">አገልግሎት</TableHead>
                          <TableHead className="text-[9px] font-bold">አፈጻጻጸም</TableHead>
                          <TableHead className="text-[9px] font-bold">ሁኔታ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {performanceData.length === 0 ? (
                          <TableRow><TableCell colSpan={3} className="text-center h-32 text-[10px] text-slate-300 font-bold uppercase italic">መረጃ የለም</TableCell></TableRow>
                        ) : (
                          performanceData.map((metric, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-[10px] font-bold">{metric.serviceName}</TableCell>
                              <TableCell className="text-[10px] font-mono">{metric.execution}%</TableCell>
                              <TableCell>
                                <Badge style={{ backgroundColor: metric.color }} className="text-[7px] text-white border-none px-2 h-4">
                                  {metric.execution >= 90 ? 'Excellent' : 'On Track'}
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
        <div className="flex gap-6"><span>ITDB Portal v2.9.9 - Stable Production</span><span className="text-primary/40">© 2024 Innovation and Technology Development Bureau</span></div>
        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>Assistant Synchronized</div>
      </footer>
    </div>
  );
}
