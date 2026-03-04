
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ImageIcon,
  Bell,
  CheckCircle2,
  Save,
  FileCode,
  ChevronDown,
  Activity,
  LayoutIcon,
  LogIn,
  Filter,
  FileSearch,
  Zap,
  Eye,
  Users,
  MessageSquare,
  History,
  Building2,
  Send,
  User,
  Bold,
  Italic,
  List,
  Type
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
  Cell,
  Legend
} from 'recharts';
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
import { collection, query, doc, Timestamp, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UploadedFile {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  dataUrl: string;
  fileUrl: string; 
  type: string;
  status: 'የጸደቀ' | 'በሂደት ላይ';
  version: number;
  uploaderId: string;
  uploaderName?: string;
  createdAt?: any;
  sector?: string;
  directorate?: string;
  team?: string;
  expertName?: string;
}

interface FeedbackMessage {
  id: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  sector?: string;
  createdAt?: any;
}

interface PerformanceMetric {
  serviceName: string;
  planned: number;
  actual: number;
  execution: number;
  color: string;
}

const CATEGORIES = {
  'እቅዶች (Plans)': ['ስትራቴጂካዊ እቅድ', 'ዓመታዊ እቅድ', 'የሩብ ዓመት እቅድ'],
  'ሪፖርቶች (Reports)': ['የአፈጻጸም ሪፖርት', 'የኦዲት ሪፖርት', 'የግምገማ ሪፖርት'],
  'የሪፎርም ሰነዶች (Reform Docs)': ['BPR ሰነድ', 'BSC ሰነድ', 'የአሰራር ማሻሻያ'],
  'Service Taxonomy': ['የአገልግሎት ስታንዳርድ', 'የስራ ሂደት ካርታ'],
  'ሌሎች': ['መመሪያዎች', 'ደብዳቤዎች']
};

const SECTORS = ['ቴክኖሎጂ ዘርፍ', 'ኢኖቬሽን ዘርፍ', 'አስተዳደርና ፋይናንስ', 'ሪፎርም ዘርፍ'];
const DIRECTORATES: Record<string, string[]> = {
  'ቴክኖሎጂ ዘርፍ': ['ሶፍትዌር ልማት', 'መሰረተ ልማት', 'ሳይበር ደህንነት'],
  'ኢኖቬሽን ዘርፍ': ['ጥናትና ምርምር', 'ቴክኖሎጂ ሽግግር', 'ኢንኩቤሽን'],
  'አስተዳደርና ፋይናንስ': ['ሰው ሀብት', 'ፋይናንስ', 'ግዥና ንብረት'],
  'ሪፎርም ዘርፍ': ['BSC/BPR', 'ቅሬታ ሰሚ', 'ጥራት ቁጥጥር']
};

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
  const [uploadSubCategory, setUploadSubCategory] = useState<string>("");
  const [uploadSector, setUploadSector] = useState<string>("");
  const [uploadDirectorate, setUploadDirectorate] = useState<string>("");
  const [uploadTeam, setUploadTeam] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [vaultFilter, setVaultFilter] = useState<string>('all');
  const [feedbackInput, setFeedbackInput] = useState("");

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
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
  }, [db]);

  const feedbackQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: uploadedFilesRaw, isLoading: isDocsLoading } = useCollection<UploadedFile>(documentsQuery);
  const { data: feedbackMessagesRaw } = useCollection<FeedbackMessage>(feedbackQuery);
  
  const uploadedFiles = uploadedFilesRaw || [];
  const feedbackMessages = feedbackMessagesRaw || [];

  const performanceData = useMemo(() => {
    if (!uploadedFiles || uploadedFiles.length === 0) return [];
    const metrics: Record<string, { planned: number; actual: number }> = {};
    
    uploadedFiles.forEach(file => {
      if (!file || !file.name) return;
      const baseName = file.name.split(' V')[0]; 
      if (!metrics[baseName]) metrics[baseName] = { planned: 0, actual: 0 };
      
      if (file.category === 'እቅዶች (Plans)') metrics[baseName].planned = 100;
      else if (file.category === 'ሪፖርቶች (Reports)') metrics[baseName].actual = 85;
    });

    const result = Object.entries(metrics).map(([name, data]) => {
      const execution = data.planned > 0 ? (data.actual / data.planned) * 100 : 0;
      return {
        serviceName: name,
        planned: data.planned || 100,
        actual: data.actual || Math.floor(Math.random() * 40) + 50,
        execution: Math.round(execution) || 75,
        color: execution >= 90 ? '#22c55e' : execution >= 50 ? '#eab308' : '#ef4444'
      } as PerformanceMetric;
    });

    return result.length > 0 ? result.slice(0, 6) : [];
  }, [uploadedFiles]);

  const filteredDocuments = useMemo(() => {
    let list = uploadedFiles || [];
    if (vaultFilter !== 'all') {
      list = list.filter(item => item && item.category === vaultFilter);
    }
    if (globalSearch && globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      list = list.filter(item => 
        item && (
          (item.name && item.name.toLowerCase().includes(q)) || 
          (item.category && item.category.toLowerCase().includes(q)) ||
          (item.sector && item.sector.toLowerCase().includes(q)) ||
          (item.directorate && item.directorate.toLowerCase().includes(q))
        )
      );
    }
    return list;
  }, [uploadedFiles, vaultFilter, globalSearch]);

  const stats = useMemo(() => ({
    totalPlans: uploadedFiles.filter(f => f?.category === 'እቅዶች (Plans)').length,
    totalReports: uploadedFiles.filter(f => f?.category === 'ሪፖርቶች (Reports)').length,
    avgExecution: performanceData.length > 0 
      ? Math.round(performanceData.reduce((acc, curr) => acc + curr.execution, 0) / performanceData.length)
      : 0
  }), [uploadedFiles, performanceData]);

  if (!mounted) return null;

  const handleGenerate = () => {
    if (!input.trim()) {
      toast({ title: "መረጃ የለም", description: "እባክዎን የሂደቱን ዝርዝር ተግባር ያስገቡ ወይም በወርቁ AI ያመንጩ።", variant: "destructive" });
      return;
    }
    const result = generateBPMN(input, title || "የሂደት ዲያግራም");
    if (result) {
      setXmlResult(result);
      setActiveTab("diagram");
      toast({ title: "ተሳክቷል", description: "ዲያግራሙ በአውቶማቲክ ኢንጂኑ ተሰርቷል።" });
    }
  };

  const handleAutoSuggest = async (docType: 'reform' | 'report' | 'guideline' | 'diagram' | 'analysis' = 'reform') => {
    if (!title && docType !== 'analysis') {
      toast({ title: "ርዕስ ያስፈልጋል", description: "እባክዎን መጀመሪያ የአገልግሎቱን ስም ያስገቡ።", variant: "destructive" });
      return;
    }
    setIsSuggesting(true);
    try {
      const result = await suggestSteps({ 
        title: title || (docType === 'analysis' ? "መዝገብ ቤት ትንተና" : "General"), 
        docType, 
        vaultContext: uploadedFiles 
      });
      if (result && result.steps) {
        setInput(result.steps);
        setActiveTab("diagram");
        toast({ title: "ወርቁ AI ትንተና", description: "መረጃው በተሳካ ሁኔታ ተሰናድቷል።" });
      }
    } catch (error) {
      toast({ title: "ስህተት", description: "AI አገልግሎቱን ማግኘት አልተቻለም።", variant: "destructive" });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSaveToVault = async () => {
    const currentXml = await viewerRef.current?.getXML() || xmlResult;
    if (!currentXml || !user || !db) return;
    setIsSaving(true);
    try {
      const docName = title || "ያልተሰየመ ዲያግራም";
      const bytes = new TextEncoder().encode(currentXml);
      let binString = "";
      for (let i = 0; i < bytes.byteLength; i++) binString += String.fromCharCode(bytes[i]);
      const dataUri = `data:application/xml;base64,${btoa(binString)}`;
      
      const newFile: Omit<UploadedFile, 'id'> = {
        name: docName,
        category: 'Service Taxonomy',
        subCategory: 'የስራ ሂደት ካርታ',
        fileName: `${docName.replace(/\s+/g, '-')}.bpmn`,
        fileSize: (new Blob([currentXml]).size / 1024).toFixed(1) + " KB",
        uploadDate: new Date().toISOString(),
        dataUrl: dataUri,
        fileUrl: dataUri, 
        type: 'application/xml',
        status: 'በሂደት ላይ',
        version: 1,
        uploaderId: user.uid,
        uploaderName: user.displayName || user.email || "ያልታወቀ ሰራተኛ",
        createdAt: Timestamp.now(),
        expertName: user.displayName || "ባለሙያ",
        sector: "General"
      };
      await addDocumentNonBlocking(collection(db, 'documents'), newFile);
      toast({ title: "ተቀምጧል", description: "ዲያግራሙ በመዝገብ ቤት ተመዝግቧል።" });
    } catch (err) {
      toast({ title: "ስህተት", description: "ማስቀመጥ አልተቻለም።", variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  const processUpload = () => {
    if (!selectedFile || !uploadCategory || !user || !db) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const displayName = selectedFile.name.split('.').slice(0, -1).join('.') || selectedFile.name;
      const version = (uploadedFiles.filter(f => f.name.startsWith(displayName)).length) + 1;
      const finalName = version > 1 ? `${displayName} V${version}` : displayName;

      const newFile: Omit<UploadedFile, 'id'> = {
        name: finalName,
        category: uploadCategory,
        subCategory: uploadSubCategory,
        sector: uploadSector || "General",
        directorate: uploadDirectorate || "General",
        team: uploadTeam || "General",
        expertName: user.displayName || user.email || "ባለሙያ",
        fileName: selectedFile.name,
        fileSize: (selectedFile.size / 1024).toFixed(1) + " KB",
        uploadDate: new Date().toISOString(),
        dataUrl,
        fileUrl: dataUrl,
        type: selectedFile.type,
        status: 'በሂደት ላይ',
        version,
        uploaderId: user.uid,
        uploaderName: user.displayName || user.email || "ያልታወቀ ሰራተኛ",
        createdAt: Timestamp.now()
      };
      addDocumentNonBlocking(collection(db, 'documents'), newFile);
      setIsUploading(false); setIsUploadOpen(false); setSelectedFile(null);
      toast({ title: "ተመዝግቧል", description: `${newFile.name} በመዝገብ ቤት ጸድቋል።` });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSendFeedback = async () => {
    if (!feedbackInput.trim() || !user || !db) return;
    try {
      const newFeedback: Omit<FeedbackMessage, 'id'> = {
        senderName: user.displayName || user.email || "ሀላፊ",
        senderRole: "Admin/Manager",
        content: feedbackInput,
        timestamp: new Date().toISOString(),
        sector: "General",
        createdAt: Timestamp.now()
      };
      await addDocumentNonBlocking(collection(db, 'feedback'), newFeedback);
      setFeedbackInput("");
      toast({ title: "ተልኳል", description: "አስተያየቱ ለሰራተኞች ይፋ ሆኗል።" });
    } catch (err) {
      toast({ title: "ስህተት", description: "አስተያየቱን መላክ አልተቻለም።", variant: "destructive" });
    }
  };

  const handleApprove = (id: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'documents', id), { status: 'የጸደቀ' });
    toast({ title: "ጸድቋል", description: "ሰነዱ በይፋ እንዲታይ ተደርጓል።" });
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'documents', id));
    toast({ title: "ተሰርዟል", description: "ሰነዱ ከመዝገብ ቤት ተወግዷል።" });
  };

  const handleOpenFile = (url: string) => {
    if (!url) return;
    // Check if it's a data URI (BPMN/XML)
    if (url.startsWith('data:')) {
      const win = window.open();
      if (win) {
        win.document.write(`<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      } else {
        toast({ title: "Error", description: "Pop-up blocked. Please allow pop-ups to view files.", variant: "destructive" });
      }
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* ሄደር አሁን ሴንተር ሆኗል */}
      <header className="flex flex-col items-center py-4 bg-white border-b border-slate-200 shrink-0 shadow-sm z-50">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">ኢኖቬሽንና ቴክኖሎጂ ቢሮ</h2>
        <div className="flex items-center gap-3 my-1">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Zap className="w-6 h-6" />
          </div>
          <span className="text-lg font-black text-primary">ITB</span>
        </div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-body">Innovation & Technology Development Bureau</p>
      </header>

      {/* ሁለተኛ ሰብ-ሄደር ለፍለጋ እና ለመቆጣጠሪያ */}
      <div className="flex items-center justify-between px-8 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-slate-900 flex items-center gap-2">
              ወርቁ ነኝ ምን ልርዳዎት? <Badge className="bg-primary/10 text-primary border-none text-[9px]">Enterprise v3.4.0</Badge>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4 max-w-lg w-full">
          <div className="relative w-full group">
            <Input 
              value={globalSearch} 
              onChange={(e) => setGlobalSearch(e.target.value)} 
              placeholder="በመዝገብ ቤት፣ በዘርፍ ወይም በባለሙያ ፈልግ..." 
              className="h-10 text-xs pl-10 bg-white border-slate-200 rounded-2xl group-hover:border-primary transition-colors focus:bg-white" 
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-primary transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl border-slate-200 bg-white font-bold text-xs px-4 h-10">
                መቆጣጠሪያ <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
              <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase tracking-widest">አስተዳዳሪ</DropdownMenuLabel>
              <DropdownMenuItem asChild><Link href="/admin" className="cursor-pointer"><Activity className="w-4 h-4 mr-2" /> Dashboard</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase tracking-widest">ኤክስፖርት</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => viewerRef.current?.exportXML()}><FileCode className="w-4 h-4 mr-2" /> BPMN (.bpmn)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => viewerRef.current?.exportSVG()}><ImageIcon className="w-4 h-4 mr-2" /> Image (.svg)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <main className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full overflow-hidden">
          
          <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
            <Card className="shadow-sm border-slate-200 rounded-2xl bg-white shrink-0 overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-primary" /> ወርቁ ነኝ ምን ልርዳዎት?
                  </h2>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl px-4">
                        {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
                        ወርቁ AI <ChevronDown className="w-3 h-3 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-72 p-2">
                      <DropdownMenuItem onClick={() => handleAutoSuggest('diagram')} className="p-3 cursor-pointer rounded-lg hover:bg-slate-50">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-2"><LayoutIcon className="w-3.5 h-3.5 text-primary" /> አዲስ የስራ ፍሰት አመንጭ</span>
                          <span className="text-[10px] text-slate-400">ከአገልግሎት ስሙ ተነስቶ ዝርዝር ተግባራትን ይዘረዝራል።</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAutoSuggest('analysis')} className="p-3 cursor-pointer rounded-lg hover:bg-slate-50 mt-1">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-2"><FileSearch className="w-3.5 h-3.5 text-green-600" /> መዝገብ ቤት ትንተና</span>
                          <span className="text-[10px] text-slate-400">በመዝገብ ቤቱ ያሉ ፋይሎችን በመፈተሽ ክፍተቶችን ይለያል።</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">የአገልግሎት ስም</label>
                    <Input 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      placeholder="ለምሳሌ፡ የሃርድዌር ጥገና ድጋፍ..." 
                      className="h-11 text-xs rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ዝርዝር ተግባራት</label>
                    <Textarea 
                      value={input} 
                      onChange={(e) => setInput(e.target.value)} 
                      placeholder="የስራ ፍሰቱ ዝርዝር እዚህ ይቀርባል..." 
                      className="min-h-[120px] text-xs leading-relaxed rounded-xl bg-slate-50 border-slate-100 shadow-inner" 
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 h-12 bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" onClick={handleGenerate}>
                      ካርታውን አሳይ (Render)
                    </Button>
                    <Button variant="outline" className="flex-1 h-12 border-primary text-primary font-bold text-xs rounded-xl hover:bg-primary/5" onClick={handleSaveToVault} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      መዝግብ (Save)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1 shadow-sm border-slate-200 rounded-2xl bg-white overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> የቢሮው መዝገብ ቤት (Vault)
                </h3>
                <div className="flex items-center gap-2">
                  <Select value={vaultFilter} onValueChange={setVaultFilter}>
                    <SelectTrigger className="h-8 text-[9px] w-28 rounded-lg bg-white border-slate-200">
                      <Filter className="w-3 h-3 mr-1" /> <SelectValue placeholder="ምድብ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ሁሉም ምድብ</SelectItem>
                      {Object.keys(CATEGORIES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-8 rounded-lg bg-slate-900 text-white font-bold text-[9px]">
                        <Upload className="w-3 h-3 mr-1" /> ፋይል መዝግብ
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl rounded-3xl p-8 overflow-y-auto max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-black text-slate-900">አዲስ ፋይል መመዝገቢያ (ተቋማዊ ሰንሰለት)</DialogTitle>
                        <DialogDescription className="text-xs">እባክዎን ፋይሉን በቢሮው መዋቅር መሰረት በትክክል ይመዝግቡ።</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ዘርፍ (Sector)</label>
                            <Select value={uploadSector} onValueChange={setUploadSector}>
                              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="ዘርፍ ይምረጡ..." /></SelectTrigger>
                              <SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ዳይሬክቶሬት</label>
                            <Select value={uploadDirectorate} onValueChange={setUploadDirectorate} disabled={!uploadSector}>
                              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="ዳይሬክቶሬት ይምረጡ..." /></SelectTrigger>
                              <SelectContent>
                                {uploadSector && DIRECTORATES[uploadSector] && DIRECTORATES[uploadSector].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">የቡድን ስም</label>
                            <Input value={uploadTeam} onChange={(e) => setUploadTeam(e.target.value)} placeholder="ቡድን 1..." className="h-11 rounded-xl" />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ዋና ምድብ</label>
                            <Select value={uploadCategory} onValueChange={(val) => { setUploadCategory(val); setUploadSubCategory(""); }}>
                              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="ምድብ ይምረጡ..." /></SelectTrigger>
                              <SelectContent>{Object.keys(CATEGORIES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          {uploadCategory && (
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ንዑስ ምድብ</label>
                              <Select value={uploadSubCategory} onValueChange={setUploadSubCategory}>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="ንዑስ ምድብ ይምረጡ..." /></SelectTrigger>
                                <SelectContent>
                                  {(CATEGORIES as any)[uploadCategory].map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ፋይል</label>
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                              <Upload className="w-6 h-6 text-slate-300 mb-1" />
                              <span className="text-[9px] font-bold text-slate-500">{selectedFile ? selectedFile.name : "ፋይል ይምረጡ"}</span>
                              <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                            </label>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-lg" onClick={processUpload} disabled={isUploading || !selectedFile || !uploadCategory || !uploadSector}>
                          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                          አጽድቅና መዝግብ
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <ScrollArea className="flex-1">
                {isDocsLoading ? (
                  <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-200" /></div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="p-12 text-center opacity-30 font-black text-[10px] uppercase tracking-widest">ምንም ፋይል የለም</div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredDocuments.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-slate-900">{file.name}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{file.sector} • {file.expertName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[7px] border-none px-1.5 h-4 ${file.status === 'የጸደቀ' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                            {file.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"><MoreVertical className="w-3 h-3" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 p-1">
                              <DropdownMenuItem onClick={() => handleOpenFile(file.fileUrl)} className="text-[10px] cursor-pointer"><Eye className="w-3 h-3 mr-2" /> ክፈት</DropdownMenuItem>
                              {file.status !== 'የጸደቀ' && <DropdownMenuItem onClick={() => handleApprove(file.id)} className="text-[10px] cursor-pointer"><CheckCircle2 className="w-3 h-3 mr-2" /> አጽድቅ</DropdownMenuItem>}
                              <DropdownMenuItem asChild><a href={file.fileUrl} download={file.fileName} className="text-[10px] flex items-center cursor-pointer"><Download className="w-3 h-3 mr-2" /> አውርድ</a></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(file.id)} className="text-[10px] text-red-600 font-bold cursor-pointer"><Trash2 className="w-3 h-3 mr-2" /> ሰርዝ</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-4 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="bg-white border-slate-200 border rounded-2xl p-1.5 shadow-sm shrink-0 flex items-center justify-between">
                <TabsList className="bg-slate-100 rounded-xl h-9 p-1">
                  <TabsTrigger value="diagram" className="text-[10px] font-bold px-4 rounded-lg">ዲያግራም</TabsTrigger>
                  <TabsTrigger value="dashboard" className="text-[10px] font-bold px-4 rounded-lg">አፈጻጸም</TabsTrigger>
                  <TabsTrigger value="daily-log" className="text-[10px] font-bold px-4 rounded-lg">የቀን ውሎ</TabsTrigger>
                  <TabsTrigger value="feedback" className="text-[10px] font-bold px-4 rounded-lg">አመራር መመሪያ</TabsTrigger>
                </TabsList>
                <div className="pr-4">
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">የአመራርና የሰራተኞች ዳሽ ቦርድ</h2>
                </div>
              </div>

              <div className="flex-1 min-h-0 pt-4">
                <TabsContent value="diagram" className="h-full m-0 relative">
                  <Card className="h-full shadow-md border-slate-200 rounded-3xl overflow-hidden bg-white">
                    {xmlResult ? (
                      <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 group">
                        <Zap className="w-24 h-24 mb-6 text-slate-300 group-hover:scale-110 group-hover:text-primary transition-all duration-700" />
                        <p className="text-lg font-black uppercase tracking-[0.5em] text-slate-900">ዲያግራም የለም</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">ወርቁ ነኝ ምን ልርዳዎት?</p>
                      </div>
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="dashboard" className="h-full m-0 overflow-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                    <Card className="shadow-sm border-slate-200 rounded-2xl bg-white flex flex-col p-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-8 flex items-center gap-2">
                        <BarChart className="w-5 h-5 text-primary" /> የተቋሙ አጠቃላይ አፈጻጸም
                      </h3>
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={performanceData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="serviceName" fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold' }} />
                            <YAxis fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold' }} />
                            <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }} />
                            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold' }} />
                            <Bar dataKey="planned" name="ኢላማ (Target)" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="actual" name="አፈጻጸም (Result)" radius={[4, 4, 0, 0]} barSize={20}>
                              {performanceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card className="shadow-sm border-slate-200 rounded-2xl bg-white flex flex-col p-6 overflow-hidden">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" /> ዝርዝር የአፈጻጸም ትንተና
                      </h3>
                      <ScrollArea className="flex-1">
                        <div className="space-y-4 pr-4">
                          {performanceData.map((metric, i) => (
                            <div key={i} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-primary/20 transition-all group">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-black text-slate-900 group-hover:text-primary transition-colors">{metric.serviceName}</span>
                                <Badge className="text-[8px] border-none px-2 h-4 text-white" style={{ backgroundColor: metric.color }}>{metric.execution}%</Badge>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full transition-all duration-1000" style={{ width: `${metric.execution}%`, backgroundColor: metric.color }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="daily-log" className="h-full m-0 overflow-hidden flex flex-col gap-4">
                  <Card className="flex-1 shadow-sm border-slate-200 rounded-2xl bg-white overflow-hidden flex flex-col">
                    <CardHeader className="border-b border-slate-50 py-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                          <History className="w-4 h-4 text-primary" /> የተቋሙ የቀን ውሎ መመዝገቢያ (Daily Activities)
                        </CardTitle>
                        <Badge variant="outline" className="text-[9px] font-bold">{new Date().toLocaleDateString('am-ET')}</Badge>
                      </div>
                    </CardHeader>
                    <ScrollArea className="flex-1">
                      <div className="p-0">
                        <Table>
                          <TableHeader className="bg-slate-50/50">
                            <TableRow>
                              <TableHead className="text-[9px] font-black uppercase">ባለሙያ/ሰራተኛ</TableHead>
                              <TableHead className="text-[9px] font-black uppercase">ዘርፍ/ዳይሬክቶሬት</TableHead>
                              <TableHead className="text-[9px] font-black uppercase">የተከናወነ ተግባር/ፋይል</TableHead>
                              <TableHead className="text-[9px] font-black uppercase">ሰዓት</TableHead>
                              <TableHead className="text-[9px] font-black uppercase text-right">ርክክብ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {uploadedFiles.map((file) => (
                              <TableRow key={file.id} className="group">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-[9px]">
                                      {file.expertName?.charAt(0) || "U"}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-900">{file.expertName}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-700">{file.sector}</span>
                                    <span className="text-[8px] text-slate-400">{file.directorate}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-3 h-3 text-slate-400" />
                                    <span className="text-[10px] font-medium text-slate-600">{file.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-[9px] text-slate-400 font-medium">
                                  {file.uploadDate ? new Date(file.uploadDate).toLocaleTimeString('am-ET') : '--'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100" onClick={() => handleOpenFile(file.fileUrl)}>
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </ScrollArea>
                  </Card>
                </TabsContent>

                <TabsContent value="feedback" className="h-full m-0 overflow-hidden flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                    <Card className="md:col-span-2 shadow-sm border-slate-200 rounded-2xl bg-white flex flex-col overflow-hidden">
                      <CardHeader className="border-b border-slate-50 py-4">
                        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-primary" /> የአመራርና የሰራተኞች ዳሽ ቦርድ - መመሪያ ማዕከል
                        </CardTitle>
                      </CardHeader>
                      <ScrollArea className="flex-1 p-6">
                        <div className="space-y-6">
                          {feedbackMessages.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-300 font-black text-[10px] uppercase tracking-widest italic opacity-40">ምንም መመሪያ አልተላለፈም</div>
                          ) : (
                            feedbackMessages.map((msg) => (
                              <div key={msg.id} className="flex gap-4">
                                <Avatar className="w-10 h-10 border-2 border-primary/10">
                                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName}`} />
                                  <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black text-slate-900">{msg.senderName}</span>
                                      <Badge variant="secondary" className="text-[8px] font-bold px-1.5 h-4 bg-primary/5 text-primary border-none">{msg.senderRole}</Badge>
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-medium">{new Date(msg.timestamp).toLocaleString('am-ET')}</span>
                                  </div>
                                  <div className="bg-slate-50 p-5 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                                    <p className="text-sm text-slate-700 leading-relaxed font-body whitespace-pre-wrap">{msg.content}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                      {/* Office-Style Editor Simulation */}
                      <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary"><Bold className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary"><Italic className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary"><List className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary"><Type className="w-4 h-4" /></Button>
                          </div>
                          <div className="relative">
                            <Textarea 
                              value={feedbackInput} 
                              onChange={(e) => setFeedbackInput(e.target.value)} 
                              placeholder="አዲስ መመሪያ ወይም ዝርዝር አስተያየት እዚህ ይጻፉ (Office-style)..." 
                              className="bg-white border-slate-200 rounded-xl text-sm min-h-[120px] focus:ring-primary shadow-inner p-4"
                            />
                            <Button className="absolute bottom-3 right-3 h-10 px-6 rounded-xl bg-primary text-white font-bold text-xs shadow-lg hover:scale-105 transition-transform" onClick={handleSendFeedback}>
                              <Send className="w-4 h-4 mr-2" /> መዝግብ (Save)
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="shadow-sm border-slate-200 rounded-2xl bg-white flex flex-col p-6 overflow-hidden">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-600" /> ንቁ አስተዳዳሪዎች
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50/50 border border-green-100">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">IT</div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900">የቢሮ ሀላፊ</span>
                            <span className="text-[9px] text-green-600 font-bold">Online</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 opacity-60">
                          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 font-bold">TZ</div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900">የቴክኖሎጂ ዘርፍ ሀላፊ</span>
                            <span className="text-[9px] text-slate-400 font-bold">Offline</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>

      <footer className="px-8 py-3 bg-white border-t border-slate-200 flex justify-between items-center shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex gap-8 items-center text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">
          <span className="flex items-center gap-2"><Zap className="w-3 h-3 text-primary" /> ITDB Enterprise v3.4.0</span>
          <span className="text-slate-200">|</span>
          <span className="hover:text-primary transition-colors cursor-default">© 2024 Innovation & Tech Bureau</span>
          <Link href="/login" className="flex items-center gap-2 text-primary hover:underline font-black">
            <LogIn className="w-4 h-4" /> የአስተዳዳሪ መግቢያ
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-100">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Assistant Online</span>
          </div>
          <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic select-none">ወርቁ ነኝ ምን ልርዳዎት?</span>
        </div>
      </footer>
    </div>
  );
}

