
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
  History,
  Briefcase,
  Bold,
  Italic,
  List,
  Type,
  XCircle,
  Settings
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
  useDoc
} from '@/firebase';
import { collection, query, doc, Timestamp, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from 'next/image';

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
  uploaderId: string;
  createdAt?: any;
}

interface UserProfile {
  id: string;
  role: string;
  displayName?: string;
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
  const [uploadExpertName, setUploadExpertName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [vaultFilter, setVaultFilter] = useState<string>('all');
  const [feedbackInput, setFeedbackInput] = useState("");

  const viewerRef = useRef<BPMNViewerRef>(null);
  const { toast } = useToast();
  
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    setMounted(true);
  }, []);

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
          (item.expertName && item.expertName.toLowerCase().includes(q))
        )
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
      toast({ title: "ተሳክቷል", description: "ዲያግራሙ ተዘጋጅቷል።" });
    }
  };

  const handleClearInputs = () => {
    setInput("");
    setTitle("");
    toast({ title: "ተሰርዟል", description: "ጸድተዋል።" });
  };

  const handleAutoSuggest = async (docType: 'reform' | 'report' | 'guideline' | 'diagram' | 'analysis' = 'reform') => {
    if (!title && docType !== 'analysis') {
      toast({ title: "ርዕስ ያስፈልጋል", description: "እባክዎን መጀመሪያ የአገልግሎቱን ስም ያስገቡ።", variant: "destructive" });
      return;
    }
    setIsSuggesting(true);
    try {
      const result = await suggestSteps({ 
        title: title || "ትንተና", 
        docType, 
        vaultContext: uploadedFiles 
      });
      if (result && result.steps) {
        setInput(result.steps);
        setActiveTab("diagram");
        toast({ title: "ወርቁ AI", description: "መረጃው ተዘጋጅቷል።" });
      }
    } catch (error) {
      toast({ title: "ስህተት", description: "AI አገልግሎቱን ማግኘት አልተቻለም።", variant: "destructive" });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!user) {
      toast({ title: "ስህተት", description: "እባክዎን መጀመሪያ ይግቡ።", variant: "destructive" });
      return;
    }
    const currentXml = await viewerRef.current?.getXML() || xmlResult;
    if (!currentXml || !db) return;
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
        uploaderName: user.displayName || user.email || "ተጠቃሚ",
        createdAt: Timestamp.now(),
        expertName: user.displayName || "ባለሙያ",
        sector: "General"
      };
      await addDocumentNonBlocking(collection(db, 'documents'), newFile);
      toast({ title: "ተቀምጧል", description: "መዝገብ ቤት ገብቷል።" });
    } catch (err) {
      toast({ title: "ስህተት", description: "ማስቀመጥ አልተቻለም።", variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  const processUpload = () => {
    if (!selectedFile || !uploadCategory || !user || !db) {
      toast({ title: "ስህተት", description: "እባክዎን ፋይል እና ምድብ በትክክል ይምረጡ።", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const displayName = selectedFile.name.split('.').slice(0, -1).join('.') || selectedFile.name;
      
      const newFile: Omit<UploadedFile, 'id'> = {
        name: displayName,
        category: uploadCategory,
        subCategory: uploadSubCategory || "ጠቅላላ",
        sector: uploadSector || "አልተጠቀሰም",
        directorate: uploadDirectorate || "አልተጠቀሰም",
        team: uploadTeam || "አልተጠቀሰም",
        expertName: uploadExpertName || user.displayName || user.email || "ባለሙያ",
        fileName: selectedFile.name,
        fileSize: (selectedFile.size / 1024).toFixed(1) + " KB",
        uploadDate: new Date().toISOString(),
        dataUrl,
        fileUrl: dataUrl,
        type: selectedFile.type,
        status: 'በሂደት ላይ',
        version: 1,
        uploaderId: user.uid,
        uploaderName: user.displayName || user.email || "ተጠቃሚ",
        createdAt: Timestamp.now()
      };
      
      try {
        await addDocumentNonBlocking(collection(db, 'documents'), newFile);
        setIsUploading(false); 
        setIsUploadOpen(false); 
        setSelectedFile(null);
        setUploadCategory("");
        setUploadSubCategory("");
        setUploadExpertName("");
        toast({ title: "ተመዝግቧል", description: "መዝገብ ቤት ገብቷል።" });
      } catch (err) {
        setIsUploading(false);
        toast({ title: "ስህተት", description: "መመዝገብ አልተቻለም።", variant: "destructive" });
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSendFeedback = async () => {
    if (!feedbackInput.trim() || !user || !db) return;
    try {
      const newFeedback: Omit<FeedbackMessage, 'id'> = {
        senderName: user.displayName || user.email || "ተጠቃሚ",
        senderRole: isAdmin ? "Admin" : "Staff",
        content: feedbackInput,
        timestamp: new Date().toISOString(),
        sector: uploadSector || "General",
        uploaderId: user.uid,
        createdAt: Timestamp.now()
      };
      await addDocumentNonBlocking(collection(db, 'feedback'), newFeedback);
      setFeedbackInput("");
      toast({ title: "ተመዝግቧል", description: "መረጃው ጸድቋል።" });
    } catch (err) {
      toast({ title: "ስህተት", description: "ማስቀመጥ አልተቻለም።", variant: "destructive" });
    }
  };

  const handleApprove = (id: string) => {
    if (!db || !isAdmin) {
      toast({ title: "ስህተት", description: "ይህንን ለማድረግ የአስተዳዳሪ ፈቃድ ያስፈልጋል።", variant: "destructive" });
      return;
    }
    updateDocumentNonBlocking(doc(db, 'documents', id), { status: 'የጸደቀ' });
    toast({ title: "ጸድቋል", description: "ሰነዱ ጸድቋል።" });
  };

  const handleDelete = (id: string, uploaderId: string) => {
    if (!db) return;
    if (!isAdmin && uploaderId !== user?.uid) {
      toast({ title: "ስህተት", description: "የራስዎን ፋይል ብቻ ነው ማጥፋት የሚችሉት።", variant: "destructive" });
      return;
    }
    deleteDocumentNonBlocking(doc(db, 'documents', id));
    toast({ title: "ተሰርዟል", description: "ሰነዱ ተወግዷል።" });
  };

  const handleOpenFile = (url: string) => {
    if (!url) return;
    const win = window.open();
    if (win) {
      if (url.startsWith('data:')) {
        win.document.write(`<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      } else {
        win.location.href = url;
      }
    } else {
      toast({ title: "Error", description: "Pop-up blocked.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="flex flex-col items-center py-4 bg-white border-b border-slate-200 shrink-0 shadow-sm z-50">
        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">ኢኖቬሽንና ቴክኖሎጂ ቢሮ</h2>
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 bg-[#1e3a8a] rounded-xl flex items-center justify-center text-white shadow-xl mb-1 relative overflow-hidden">
             <Image 
              src="https://picsum.photos/seed/itdb-tech/200/200" 
              alt="ITB Logo" 
              fill
              className="object-cover"
              data-ai-hint="technology logo"
            />
          </div>
          <span className="text-lg font-black text-[#1e3a8a] tracking-widest">ITB</span>
        </div>
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.3em] font-body mt-1">Innovation & Technology Bureau</p>
      </header>

      <div className="flex items-center justify-between px-6 py-2 bg-slate-50 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
           {isAdmin && (
             <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-[8px] font-black uppercase">Admin Mode</Badge>
           )}
        </div>

        <div className="flex items-center gap-3 max-w-lg w-full">
          <div className="relative w-full group">
            <Input 
              value={globalSearch} 
              onChange={(e) => setGlobalSearch(e.target.value)} 
              placeholder="በመዝገብ ቤት፣ በዘርፍ ወይም በባለሙያ ፈልግ..." 
              className="h-9 text-xs pl-9 bg-white border-slate-200 rounded-xl group-hover:border-[#1e3a8a] transition-colors focus:bg-white" 
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#1e3a8a] transition-colors" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-[#1e3a8a] transition-colors h-8 w-8">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl border-slate-200 bg-white font-black text-[10px] px-3 h-8">
                መቆጣጠሪያ <ChevronDown className="w-3 h-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-2">
              <DropdownMenuLabel className="text-[9px] text-slate-400 uppercase tracking-widest">መቆጣጠሪያ</DropdownMenuLabel>
              <DropdownMenuItem asChild><Link href="/admin" className="cursor-pointer text-xs"><Activity className="w-3.5 h-3.5 mr-2" /> Dashboard</Link></DropdownMenuItem>
              {isAdmin && <DropdownMenuItem asChild><Link href="/admin" className="cursor-pointer text-xs"><Settings className="w-3.5 h-3.5 mr-2" /> Admin Tools</Link></DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[9px] text-slate-400 uppercase tracking-widest">ኤክስፖርት</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => viewerRef.current?.exportXML()} className="text-xs"><FileCode className="w-3.5 h-3.5 mr-2" /> BPMN (.bpmn)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => viewerRef.current?.exportSVG()} className="text-xs"><ImageIcon className="w-3.5 h-3.5 mr-2" /> Image (.svg)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <main className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full overflow-hidden">
          
          <div className="lg:col-span-4 flex flex-col gap-3 overflow-hidden">
            <Card className="shadow-sm border-slate-200 rounded-2xl bg-white shrink-0 overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <BrainCircuit className="w-3.5 h-3.5 text-[#1e3a8a]" /> AI ረዳት
                  </h2>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold text-red-500 hover:bg-red-50 rounded-lg px-2" onClick={handleClearInputs}>
                      <XCircle className="w-3 h-3 mr-1" /> አጥፋ
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold text-[#1e3a8a] bg-[#1e3a8a]/5 hover:bg-[#1e3a8a]/10 rounded-lg px-3">
                          {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <BrainCircuit className="w-3.5 h-3.5 mr-1" />}
                          አመንጭ <ChevronDown className="w-2.5 h-2.5 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64 p-2">
                        <DropdownMenuItem onClick={() => handleAutoSuggest('diagram')} className="p-2.5 cursor-pointer rounded-lg hover:bg-slate-50">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-2"><LayoutIcon className="w-3.5 h-3.5 text-[#1e3a8a]" /> አዲስ የስራ ፍሰት</span>
                            <span className="text-[9px] text-slate-400">ከአገልግሎት ስሙ ተነስቶ ዝርዝር ተግባራትን ይዘረዝራል።</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAutoSuggest('analysis')} className="p-2.5 cursor-pointer rounded-lg hover:bg-slate-50 mt-1">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-2"><FileSearch className="w-3.5 h-3.5 text-green-600" /> መዝገብ ቤት ትንተና</span>
                            <span className="text-[9px] text-slate-400">በመዝገብ ቤቱ ያሉ ፋይሎችን በመፈተሽ ክፍተቶችን ይለያል።</span>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">የአገልግሎት ስም</label>
                    <Input 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      placeholder="ለምሳሌ፡ የሃርድዌር ጥገና ድጋፍ..." 
                      className="h-9 text-xs rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all shadow-inner" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">ዝርዝር ተግባራት</label>
                    <Textarea 
                      value={input} 
                      onChange={(e) => setInput(e.target.value)} 
                      placeholder="የስራ ፍሰቱ ዝርዝር እዚህ ይቀርባል..." 
                      className="min-h-[100px] text-xs leading-relaxed rounded-xl bg-slate-50 border-slate-100 shadow-inner" 
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 h-10 bg-[#1e3a8a] text-white font-bold text-xs rounded-xl shadow-lg hover:scale-[1.02] transition-transform" onClick={handleGenerate}>
                      ካርታውን አሳይ (Render)
                    </Button>
                    <Button variant="outline" className="flex-1 h-10 border-[#1e3a8a] text-[#1e3a8a] font-bold text-xs rounded-xl hover:bg-[#1e3a8a]/5" onClick={handleSaveToVault} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                      መዝግብ (Save)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1 shadow-sm border-slate-200 rounded-2xl bg-white overflow-hidden flex flex-col">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> የቢሮው መዝገብ ቤት (Vault)
                </h3>
                <div className="flex items-center gap-1.5">
                  <Select value={vaultFilter} onValueChange={setVaultFilter}>
                    <SelectTrigger className="h-7 text-[8px] w-24 rounded-lg bg-white border-slate-200">
                      <Filter className="w-2.5 h-2.5 mr-1" /> <SelectValue placeholder="ምድብ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ሁሉም</SelectItem>
                      {Object.keys(CATEGORIES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-7 rounded-lg bg-slate-900 text-white font-black text-[8px] px-2">
                        <Upload className="w-2.5 h-2.5 mr-1" /> ፋይል መዝግብ
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl rounded-2xl p-6 overflow-y-auto max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-900">አዲስ ፋይል መመዝገቢያ</DialogTitle>
                        <DialogDescription className="text-xs">የፋይሉን ዝርዝር መረጃ በትክክል ያስገቡ።</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ዘርፍ (Sector)</label>
                            <Input value={uploadSector} onChange={(e) => setUploadSector(e.target.value)} placeholder="ዘርፍ ያስገቡ..." className="h-10 rounded-xl" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ዳይሬክቶሬት</label>
                            <Input value={uploadDirectorate} onChange={(e) => setUploadDirectorate(e.target.value)} placeholder="ዳይሬክቶሬት ያስገቡ..." className="h-10 rounded-xl" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">የቡድን ስም</label>
                            <Input value={uploadTeam} onChange={(e) => setUploadTeam(e.target.value)} placeholder="የቡድን ስም ያስገቡ..." className="h-10 rounded-xl" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">የባለሙያ ስም (Expert Name)</label>
                            <Input value={uploadExpertName} onChange={(e) => setUploadExpertName(e.target.value)} placeholder="የባለሙያ ስም ያስገቡ..." className="h-10 rounded-xl" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">የሰነዱ ዋና ምድብ</label>
                            <Select value={uploadCategory} onValueChange={(val) => { setUploadCategory(val); setUploadSubCategory(""); }}>
                              <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="ምድብ ይምረጡ..." /></SelectTrigger>
                              <SelectContent>{Object.keys(CATEGORIES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          {uploadCategory && (
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ንዑስ ምድብ</label>
                              <Select value={uploadSubCategory} onValueChange={setUploadSubCategory}>
                                <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="ንዑስ ምድብ ይምረጡ..." /></SelectTrigger>
                                <SelectContent>
                                  {(CATEGORIES as any)[uploadCategory].map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ፋይል</label>
                            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                              <Upload className="w-5 h-5 text-slate-300 mb-1" />
                              <span className="text-[9px] font-bold text-slate-500">{selectedFile ? selectedFile.name : "ፋይል ይምረጡ"}</span>
                              <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                            </label>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button className="w-full h-12 bg-[#1e3a8a] text-white font-black text-sm rounded-xl shadow-lg hover:scale-[1.01] transition-transform" onClick={processUpload} disabled={isUploading || !selectedFile || !uploadCategory}>
                          {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
                          አጽድቅና መዝግብ
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <ScrollArea className="flex-1">
                {isDocsLoading ? (
                  <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-200" /></div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="p-8 text-center opacity-30 font-black text-[9px] uppercase tracking-widest">ምንም ፋይል የለም</div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredDocuments.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-[#1e3a8a]/10 group-hover:text-[#1e3a8a] transition-colors">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-900 line-clamp-1">{file.name}</span>
                            <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider">{file.sector} • {file.expertName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={`text-[7px] border-none px-1 h-3.5 font-black ${file.status === 'የጸደቀ' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                            {file.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="w-3 h-3" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 p-1.5">
                              <DropdownMenuItem onClick={() => handleOpenFile(file.fileUrl)} className="text-[10px] cursor-pointer font-black"><Eye className="w-3.5 h-3.5 mr-2 text-blue-600" /> ክፈት (Open)</DropdownMenuItem>
                              {(isAdmin && file.status !== 'የጸደቀ') && <DropdownMenuItem onClick={() => handleApprove(file.id)} className="text-[10px] cursor-pointer font-black"><CheckCircle2 className="w-3.5 h-3.5 mr-2 text-green-600" /> አጽድቅ (Approve)</DropdownMenuItem>}
                              <DropdownMenuItem asChild><a href={file.fileUrl} download={file.fileName} className="text-[10px] flex items-center cursor-pointer font-black"><Download className="w-3.5 h-3.5 mr-2 text-primary" /> አውርድ (Download)</a></DropdownMenuItem>
                              {(isAdmin || file.uploaderId === user?.uid) && (
                                <DropdownMenuItem onClick={() => handleDelete(file.id, file.uploaderId)} className="text-[10px] text-red-600 font-black cursor-pointer"><Trash2 className="w-3.5 h-3.5 mr-2" /> ሰርዝ (Delete)</DropdownMenuItem>
                              )}
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

          <div className="lg:col-span-8 flex flex-col gap-3 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="bg-white border-slate-200 border rounded-2xl p-1 shadow-sm shrink-0 flex items-center justify-between">
                <TabsList className="bg-slate-100 rounded-xl h-8 p-1">
                  <TabsTrigger value="diagram" className="text-[9px] font-black px-3 rounded-lg">ዲያግራም</TabsTrigger>
                  <TabsTrigger value="dashboard" className="text-[9px] font-black px-3 rounded-lg">አፈጻጸም</TabsTrigger>
                  <TabsTrigger value="daily-log" className="text-[9px] font-black px-3 rounded-lg">የቀን ውሎ</TabsTrigger>
                  <TabsTrigger value="feedback" className="text-[9px] font-black px-3 rounded-lg">የአመራርና የሰራተኞች ዳሽ ቦርድ</TabsTrigger>
                </TabsList>
                <div className="pr-3 hidden sm:block">
                  <h2 className="text-[9px] font-black text-slate-900 uppercase tracking-widest">ITB Portal v3.8.1</h2>
                </div>
              </div>

              <div className="flex-1 min-0 pt-3">
                <TabsContent value="diagram" className="h-full m-0 relative">
                  <Card className="h-full shadow-md border-slate-200 rounded-2xl overflow-hidden bg-white">
                    {xmlResult ? (
                      <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 group">
                        <Zap className="w-20 h-20 mb-4 text-slate-300 group-hover:scale-110 group-hover:text-[#1e3a8a] transition-all duration-700" />
                        <p className="text-sm font-black uppercase tracking-[0.5em] text-slate-900">ዲያግራም የለም</p>
                      </div>
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="dashboard" className="h-full m-0 overflow-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
                    <Card className="shadow-sm border-slate-200 rounded-2xl bg-white flex flex-col p-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
                        <BarChart className="w-4 h-4 text-[#1e3a8a]" /> የተቋሙ አጠቃላይ አፈጻጸም
                      </h3>
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={performanceData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="serviceName" fontSize={8} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold' }} />
                            <YAxis fontSize={8} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold' }} />
                            <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '9px' }} />
                            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '9px', fontWeight: 'bold' }} />
                            <Bar dataKey="planned" name="ኢላማ" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={16} />
                            <Bar dataKey="actual" name="አፈጻጸም" radius={[4, 4, 0, 0]} barSize={16}>
                              {performanceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card className="shadow-sm border-slate-200 rounded-2xl bg-white flex flex-col p-4 overflow-hidden">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" /> ዝርዝር የአፈጻጸም ትንተና
                      </h3>
                      <ScrollArea className="flex-1">
                        <div className="space-y-3 pr-2">
                          {performanceData.map((metric, i) => (
                            <div key={i} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:border-[#1e3a8a]/20 transition-all group">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-slate-900 group-hover:text-[#1e3a8a] transition-colors">{metric.serviceName}</span>
                                <Badge className="text-[7px] border-none px-1.5 h-3.5 text-white" style={{ backgroundColor: metric.color }}>{metric.execution}%</Badge>
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

                <TabsContent value="daily-log" className="h-full m-0 overflow-hidden flex flex-col gap-3">
                  <Card className="flex-1 shadow-sm border-slate-200 rounded-2xl bg-white overflow-hidden flex flex-col">
                    <CardHeader className="border-b border-slate-50 py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <History className="w-3.5 h-3.5 text-[#1e3a8a]" /> የቀን ውሎ መመዝገቢያ
                        </CardTitle>
                        <Badge variant="outline" className="text-[8px] font-bold">{new Date().toLocaleDateString('am-ET')}</Badge>
                      </div>
                    </CardHeader>
                    <ScrollArea className="flex-1">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow>
                            <TableHead className="text-[8px] font-black uppercase">ሰራተኛ</TableHead>
                            <TableHead className="text-[8px] font-black uppercase">ዘርፍ/ዳይሬክቶሬት</TableHead>
                            <TableHead className="text-[8px] font-black uppercase">ተግባር/ፋይል</TableHead>
                            <TableHead className="text-[8px] font-black uppercase">ሰዓት</TableHead>
                            <TableHead className="text-[8px] font-black uppercase text-right">ርክክብ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uploadedFiles.map((file) => (
                            <TableRow key={file.id} className="group">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="bg-[#1e3a8a]/10 text-[#1e3a8a] text-[8px]">{file.expertName?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-[9px] font-black text-slate-900">{file.expertName}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-slate-700">{file.sector}</span>
                                  <span className="text-[7.5px] text-slate-400">{file.directorate}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <FileText className="w-3 h-3 text-slate-400" />
                                  <span className="text-[9px] font-medium text-slate-600 line-clamp-1">{file.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-[8px] text-slate-400 font-medium">
                                {file.uploadDate ? new Date(file.uploadDate).toLocaleTimeString('am-ET') : '--'}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleOpenFile(file.fileUrl)}>
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </Card>
                </TabsContent>

                <TabsContent value="feedback" className="h-full m-0 overflow-hidden flex flex-col gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-full">
                    <Card className="md:col-span-2 shadow-sm border-slate-200 rounded-2xl bg-white flex flex-col overflow-hidden">
                      <CardHeader className="border-b border-slate-50 py-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-[#1e3a8a]" /> የአመራርና የሰራተኞች ዳሽ ቦርድ
                        </CardTitle>
                      </CardHeader>
                      <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                          {feedbackMessages.length === 0 ? (
                            <div className="h-48 flex flex-col items-center justify-center text-slate-300 font-black text-[9px] uppercase tracking-widest italic opacity-40">ምንም መረጃ የለም</div>
                          ) : (
                            feedbackMessages.map((msg) => (
                              <div key={msg.id} className="flex gap-3">
                                <Avatar className="w-8 h-8 border border-[#1e3a8a]/10">
                                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName}`} />
                                  <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-black text-slate-900">{msg.senderName}</span>
                                      <Badge variant="secondary" className="text-[7px] font-black px-1 h-3.5 bg-[#1e3a8a]/5 text-[#1e3a8a] border-none">{msg.senderRole}</Badge>
                                    </div>
                                    <span className="text-[8px] text-slate-400 font-medium">{new Date(msg.timestamp).toLocaleString('am-ET')}</span>
                                  </div>
                                  <div className="bg-slate-50 p-3 rounded-xl rounded-tl-none border border-slate-100 shadow-sm relative group">
                                    <p className="text-xs text-slate-700 leading-relaxed font-body whitespace-pre-wrap">{msg.content}</p>
                                    {(isAdmin || msg.uploaderId === user?.uid) && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                                        onClick={() => deleteDocumentNonBlocking(doc(db!, 'feedback', msg.id))}
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                      <div className="p-3 bg-white border-t border-slate-100 shadow-inner">
                        <div className="flex flex-col gap-2 max-w-4xl mx-auto">
                          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg w-fit">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-[#1e3a8a]"><Bold className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-[#1e3a8a]"><Italic className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-[#1e3a8a]"><List className="w-3.5 h-3.5" /></Button>
                          </div>
                          <div className="relative">
                            <Textarea 
                              value={feedbackInput} 
                              onChange={(e) => setFeedbackInput(e.target.value)} 
                              placeholder="አዲስ መመሪያ ወይም ሪፖርት እዚህ ይጻፉ..." 
                              className="bg-white border-slate-200 rounded-xl text-xs min-h-[120px] focus:ring-[#1e3a8a] shadow-inner p-3 font-body"
                            />
                            <Button className="absolute bottom-2 right-2 h-9 px-6 rounded-lg bg-[#1e3a8a] text-white font-black text-[10px] shadow-lg hover:scale-105 transition-transform" onClick={handleSendFeedback}>
                              <Save className="w-4 h-4 mr-2" /> መዝግብ
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="shadow-sm border-slate-200 rounded-2xl bg-white flex flex-col p-4 overflow-hidden">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-green-600" /> ባለሙያዎች
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-green-50/50 border border-green-100">
                          <Avatar className="w-8 h-8 border border-green-200">
                             <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.displayName || 'user'}`} />
                             <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-900">{user?.displayName || user?.email?.split('@')[0]}</span>
                            <span className="text-[8px] text-green-600 font-bold uppercase">Online Now</span>
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

      <footer className="px-6 py-2 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
        <div className="flex gap-6 items-center text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">
          <span className="flex items-center gap-1.5">ITB Enterprise v3.8.1</span>
          <span className="text-slate-200">|</span>
          <Link href="/admin" className="flex items-center gap-1.5 text-[#1e3a8a] hover:underline">
            <LogIn className="w-3.5 h-3.5" /> የአስተዳዳሪ መቆጣጠሪያ
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">System Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
