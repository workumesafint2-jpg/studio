
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
  Filter,
  FileSearch,
  Zap,
  Eye,
  Users,
  History,
  Bold,
  Italic,
  List,
  XCircle,
  Settings,
  MessageSquare,
  Send,
  LogOut,
  User as UserIcon,
  LogIn
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
import { 
  useCollection, 
  useUser, 
  useFirestore, 
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking,
  useDoc,
  useAuth
} from '@/firebase';
import { collection, query, doc, Timestamp, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from 'next/image';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

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
  email?: string;
}

const CATEGORIES = {
  'እቅዶች (Plans)': ['ስትራቴጂካዊ እቅድ', 'ዓመታዊ እቅድ', 'የሩብ ዓመት እቅድ'],
  'ሪፖርቶች (Reports)': ['የአፈጻጸም ሪፖርት', 'የኦዲት ሪፖርት', 'የግምገማ ሪፖርት'],
  'የሪፎርም ሰነዶች (Reform Docs)': ['BPR ሰነድ', 'BSC ሰነድ', 'የአሰራር ማሻሻያ'],
  'Service Taxonomy': ['የአገልግሎት ስታንዳርድ', 'የስራ ሂደት ካርታ'],
  'ሌሎች': ['መመሪያዎች', 'ደብዳቤዎች']
};

const ADMIN_EMAIL = "workumesafint2@gmail.com";

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
  const [uploadSector, setUploadSector] = useState<string>("");
  const [uploadDirectorate, setUploadDirectorate] = useState<string>("");
  const [uploadTeam, setUploadTeam] = useState<string>("");
  const [uploadExpertName, setUploadExpertName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [vaultFilter, setVaultFilter] = useState<string>('all');
  const [feedbackInput, setFeedbackInput] = useState("");

  const viewerRef = useRef<BPMNViewerRef>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const isAdmin = user?.email === ADMIN_EMAIL || userProfile?.role === 'admin';

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
      
      if (file.category?.toLowerCase().includes('እቅድ')) metrics[baseName].planned = 100;
      else if (file.category?.toLowerCase().includes('ሪፖርት')) metrics[baseName].actual = 85;
    });

    const data = Object.entries(metrics).map(([name, data]) => {
      const execution = data.planned > 0 ? (data.actual / data.planned) * 100 : 0;
      return {
        serviceName: name,
        planned: data.planned || 100,
        actual: data.actual || Math.floor(Math.random() * 40) + 50,
        execution: Math.round(execution) || 75,
        color: execution >= 90 ? '#22c55e' : execution >= 50 ? '#eab308' : '#ef4444'
      };
    }).slice(0, 6);

    return data.length > 0 ? data : [
      { serviceName: 'ምሳሌ', planned: 100, actual: 75, execution: 75, color: '#eab308' }
    ];
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

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    toast({ title: "ተሰናብተዋል", description: "ከሲስተሙ በትክክል ወጥተዋል።" });
    router.push('/login');
  };

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
      router.push('/login');
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
        expertName: user.displayName || user.email || "ባለሙያ",
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
      toast({ title: "ስህተት", description: "እባክዎን ፋይል እና የፋይሉን አይነት በትክክል ያስገቡ።", variant: "destructive" });
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
        subCategory: "ጠቅላላ",
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
        toast({ title: "ተመዝግቧል", description: "መዝገብ ቤት ገብቷል።" });
      } catch (err) {
        setIsUploading(false);
        toast({ title: "ስህተት", description: "መመዝገብ አልተቻለም።", variant: "destructive" });
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSendFeedback = async () => {
    if (!feedbackInput.trim() || !user || !db) {
      if(!user) router.push('/login');
      return;
    }
    try {
      const newFeedback: Omit<FeedbackMessage, 'id'> = {
        senderName: user.displayName || user.email || "ተጠቃሚ",
        senderRole: isAdmin ? "Admin" : "Staff",
        content: feedbackInput,
        timestamp: new Date().toISOString(),
        sector: "General",
        uploaderId: user.uid,
        createdAt: Timestamp.now()
      };
      await addDocumentNonBlocking(collection(db, 'feedback'), newFeedback);
      setFeedbackInput("");
      toast({ title: "ተመዝግቧል", description: "መልዕክቱ ተልኳል።" });
    } catch (err) {
      toast({ title: "ስህተት", description: "መላክ አልተቻለም።", variant: "destructive" });
    }
  };

  const handleApprove = (id: string) => {
    if (!db || !isAdmin) return;
    updateDocumentNonBlocking(doc(db, 'documents', id), { status: 'የጸደቀ' });
    toast({ title: "ጸድቋል", description: "ሰነዱ ጸድቋል።" });
  };

  const handleDelete = (id: string, uploaderId: string) => {
    if (!db) return;
    if (!isAdmin && uploaderId !== user?.uid) return;
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
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="flex flex-col items-center py-4 bg-white border-b border-slate-200 shrink-0 shadow-md z-50">
        <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-3 uppercase">ኢኖቬሽንና ቴክኖሎጂ ቢሮ</h2>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-[#1e3a8a] rounded-2xl flex items-center justify-center text-white shadow-2xl mb-1 relative overflow-hidden border-2 border-white">
             <Image 
              src="https://picsum.photos/seed/addis-ababa-logo/400/400" 
              alt="Addis Ababa Logo" 
              fill
              className="object-contain p-1"
              data-ai-hint="Addis Ababa City Administration logo"
            />
          </div>
          <span className="text-xl font-black text-[#1e3a8a] tracking-widest leading-none mt-2">ITB</span>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-1.5">Innovation & Technology Bureau</p>
      </header>

      <div className="flex items-center justify-between px-6 py-2 bg-slate-50 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
           {isAdmin ? (
             <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-[9px] font-black uppercase">Master Admin Portal</Badge>
           ) : user ? (
             <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[9px] font-black uppercase">Staff Portal</Badge>
           ) : (
             <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 text-[9px] font-black uppercase">Guest Access</Badge>
           )}
        </div>

        <div className="flex items-center gap-3 max-w-xl w-full mx-4">
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
          <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-[#1e3a8a] h-9 w-9">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl border-slate-200 bg-white font-black text-[10px] px-3 h-9 shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                <Avatar className="h-6 w-6 border border-slate-100">
                  <AvatarFallback className="text-[8px] bg-[#1e3a8a] text-white">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || <UserIcon className="h-3 w-3" />}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[100px] truncate hidden sm:block">
                  {user?.displayName || user?.email || "አካውንት"}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase tracking-widest">ተግባራት (Activities)</DropdownMenuLabel>
              {user ? (
                <>
                  <DropdownMenuItem asChild><Link href="/admin" className="cursor-pointer text-xs"><LayoutIcon className="w-4 h-4 mr-2" /> መቆጣጠሪያ (Dashboard)</Link></DropdownMenuItem>
                  {isAdmin && <DropdownMenuItem asChild><Link href="/admin" className="cursor-pointer text-xs font-black text-[#1e3a8a]"><Settings className="w-4 h-4 mr-2" /> Master Admin Tools</Link></DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-xs text-red-600 font-bold"><LogOut className="w-4 h-4 mr-2" /> ውጣ (Logout)</DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild><Link href="/login" className="cursor-pointer text-xs font-black"><LogIn className="w-4 h-4 mr-2" /> ግባ (Login / Sign Up)</Link></DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase tracking-widest">ኤክስፖርት (Export)</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => viewerRef.current?.exportXML()} className="text-xs"><FileCode className="w-4 h-4 mr-2" /> BPMN (.bpmn)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => viewerRef.current?.exportSVG()} className="text-xs"><ImageIcon className="w-4 h-4 mr-2" /> Image (.svg)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <main className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 h-full overflow-hidden">
          
          {/* LEFT PANEL - AI & VAULT - 40% (5/12) */}
          <div className="lg:col-span-5 flex flex-col gap-2 overflow-hidden">
            <Card className="shadow-sm border-slate-200 rounded-2xl bg-white shrink-0 overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-[#1e3a8a]" /> AI ረዳት
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black text-red-500 hover:bg-red-50 rounded-xl px-3" onClick={handleClearInputs}>
                      <XCircle className="w-4 h-4 mr-1.5" /> አጥፋ
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black text-[#1e3a8a] bg-[#1e3a8a]/5 hover:bg-[#1e3a8a]/10 rounded-xl px-3">
                          {isSuggesting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Zap className="w-3.5 h-3.5 mr-1.5" />}
                          አመንጭ <ChevronDown className="w-2.5 h-2.5 ml-1.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-72 p-2">
                        <DropdownMenuItem onClick={() => handleAutoSuggest('diagram')} className="p-3 cursor-pointer rounded-xl hover:bg-slate-50">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-black text-slate-900 flex items-center gap-2"><LayoutIcon className="w-4 h-4 text-[#1e3a8a]" /> አዲስ የስራ ፍሰት</span>
                            <span className="text-[10px] text-slate-400">ከአገልግሎት ስሙ ተነስቶ ዝርዝር ተግባራትን ይዘረዝራል።</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAutoSuggest('analysis')} className="p-3 cursor-pointer rounded-xl hover:bg-slate-50 mt-1.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-black text-slate-900 flex items-center gap-2"><FileSearch className="w-4 h-4 text-green-600" /> መዝገብ ቤት ትንተና</span>
                            <span className="text-[10px] text-slate-400">በመዝገብ ቤቱ ያሉ ፋይሎችን በመፈተሽ ክፍተቶችን ይለያል።</span>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1.5">የአገልግሎት ስም</label>
                    <Input 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      placeholder="ለምሳሌ፡ የሃርድዌር ጥገና ድጋፍ..." 
                      className="h-9 text-xs rounded-xl bg-slate-50 border-slate-100 focus:bg-white" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1.5">ዝርዝር ተግባራት</label>
                    <Textarea 
                      value={input} 
                      onChange={(e) => setInput(e.target.value)} 
                      placeholder="የስራ ፍሰቱ ዝርዝር እዚህ ይቀርባል..." 
                      className="min-h-[100px] text-xs leading-relaxed rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all duration-75" 
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1 h-10 bg-[#1e3a8a] text-white font-black text-[11px] rounded-xl shadow-lg" onClick={handleGenerate}>
                      ካርታውን አሳይ (Render)
                    </Button>
                    <Button variant="outline" className="flex-1 h-10 border-[#1e3a8a] text-[#1e3a8a] font-black text-[11px] rounded-xl" onClick={handleSaveToVault} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      መዝግብ (Save)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1 shadow-sm border-slate-200 rounded-2xl bg-white overflow-hidden flex flex-col">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> መዝገብ ቤት (Vault)
                </h3>
                <div className="flex items-center gap-2">
                  <Select value={vaultFilter} onValueChange={setVaultFilter}>
                    <SelectTrigger className="h-7 text-[9px] w-24 rounded-xl bg-white border-slate-200">
                      <Filter className="w-3 h-3 mr-1.5" /> <SelectValue placeholder="ምድብ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ሁሉም</SelectItem>
                      {Object.keys(CATEGORIES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-7 rounded-xl bg-slate-900 text-white font-black text-[9px] px-3">
                        <Upload className="w-3 h-3 mr-1.5" /> ፋይል መዝግብ
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl rounded-2xl p-6 overflow-y-auto max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-black text-slate-900">አዲስ ፋይል መመዝገቢያ</DialogTitle>
                        <DialogDescription className="text-sm">የፋይሉን ዝርዝር መረጃ በትክክል ያስገቡ።</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ዘርፍ (Sector)</label>
                            <Input value={uploadSector} onChange={(e) => setUploadSector(e.target.value)} placeholder="ዘርፍ..." className="h-11 rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ዳይሬክቶሬት</label>
                            <Input value={uploadDirectorate} onChange={(e) => setUploadDirectorate(e.target.value)} placeholder="ዳይሬክቶሬት..." className="h-11 rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">የቡድን ስም</label>
                            <Input value={uploadTeam} onChange={(e) => setUploadTeam(e.target.value)} placeholder="የቡድን ስም..." className="h-11 rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">የባለሙያ ስም (Expert Name)</label>
                            <Input value={uploadExpertName} onChange={(e) => setUploadExpertName(e.target.value)} placeholder="የባለሙያ ስም..." className="h-11 rounded-xl" />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">የፋይሉ አይነት (File Type)</label>
                            <Input 
                              value={uploadCategory} 
                              onChange={(e) => setUploadCategory(e.target.value)} 
                              placeholder="ለምሳሌ፡ እቅድ፣ ሪፖርት..." 
                              className="h-11 rounded-xl" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ፋይል (File)</label>
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                              <Upload className="w-8 h-8 text-slate-300 mb-2" />
                              <span className="text-[10px] font-black text-slate-500">{selectedFile ? selectedFile.name : "ፋይል ይምረጡ"}</span>
                              <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                            </label>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button className="w-full h-12 bg-[#1e3a8a] text-white font-black text-sm rounded-xl shadow-xl" onClick={processUpload} disabled={isUploading || !selectedFile || !uploadCategory}>
                          {isUploading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
                          አጽድቅና መዝግብ (Submit)
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <ScrollArea className="flex-1">
                {isDocsLoading ? (
                  <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-200" /></div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="p-10 text-center opacity-30 font-black text-[10px] uppercase tracking-widest">ምንም ፋይል የለም</div>
                ) : (
                  <div className="p-3 space-y-1.5">
                    {filteredDocuments.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#1e3a8a]/10 group-hover:text-[#1e3a8a] transition-colors">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-900 line-clamp-1">{file.name}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{file.expertName} • {file.uploadDate ? new Date(file.uploadDate).toLocaleDateString('am-ET') : '--'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[8px] border-none px-2 h-4 font-black ${file.status === 'የጸደቀ' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                            {file.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-4 h-4 text-slate-400" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-1.5">
                              <DropdownMenuItem onClick={() => handleOpenFile(file.fileUrl)} className="text-[10px] cursor-pointer font-black"><Eye className="w-4 h-4 mr-2.5 text-blue-600" /> ክፈት (Open)</DropdownMenuItem>
                              {(isAdmin && file.status !== 'የጸደቀ') && <DropdownMenuItem onClick={() => handleApprove(file.id)} className="text-[10px] cursor-pointer font-black"><CheckCircle2 className="w-4 h-4 mr-2.5 text-green-600" /> አጽድቅ (Approve)</DropdownMenuItem>}
                              <DropdownMenuItem asChild><a href={file.fileUrl} download={file.fileName} className="text-[10px] flex items-center cursor-pointer font-black"><Download className="w-4 h-4 mr-2.5 text-primary" /> አውርድ (Download)</a></DropdownMenuItem>
                              {(isAdmin || file.uploaderId === user?.uid) && (
                                <DropdownMenuItem onClick={() => handleDelete(file.id, file.uploaderId)} className="text-[10px] text-red-600 font-black cursor-pointer"><Trash2 className="w-4 h-4 mr-2.5" /> ሰርዝ (Delete)</DropdownMenuItem>
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

          {/* RIGHT PANEL - TABS & DIAGRAM - 60% (7/12) */}
          <div className="lg:col-span-7 flex flex-col gap-2 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="bg-white border-slate-200 border rounded-2xl p-1 shadow-sm shrink-0 flex items-center justify-between">
                <TabsList className="bg-slate-100 rounded-xl h-8 p-1">
                  <TabsTrigger value="diagram" className="text-[10px] font-black px-4 rounded-lg">ዲያግራም (Diagram)</TabsTrigger>
                  <TabsTrigger value="dashboard" className="text-[10px] font-black px-4 rounded-lg">አፈጻጸም (Performance)</TabsTrigger>
                  <TabsTrigger value="daily-log" className="text-[10px] font-black px-4 rounded-lg">የቀን ውሎ (Log)</TabsTrigger>
                  <TabsTrigger value="feedback" className="text-[10px] font-black px-4 rounded-lg">ዳሽ ቦርድ (Collab Hub)</TabsTrigger>
                </TabsList>
                <div className="pr-4 hidden sm:block">
                  <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ITB Pro v4.2.0</h2>
                </div>
              </div>

              <div className="flex-1 min-0 pt-2">
                <TabsContent value="diagram" className="h-full m-0 relative">
                  <Card className="h-full shadow-md border-slate-200 rounded-2xl overflow-hidden bg-white">
                    {xmlResult ? (
                      <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-10">
                        <Zap className="w-32 h-32 mb-6" />
                        <p className="text-lg font-black uppercase tracking-[0.5em]">BPMN ካርታ የለም</p>
                      </div>
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="dashboard" className="h-full m-0 overflow-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-full">
                    <Card className="shadow-sm border-slate-200 rounded-2xl bg-white flex flex-col p-5">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-5 flex items-center gap-2">
                        <BarChart className="w-5 h-5 text-[#1e3a8a]" /> አጠቃላይ አፈጻጸም
                      </h3>
                      <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="serviceName" fontSize={9} fontWeight="bold" />
                            <YAxis fontSize={9} fontWeight="bold" />
                            <RechartsTooltip contentStyle={{ fontSize: '10px', borderRadius: '12px', fontWeight: 'bold' }} />
                            <Bar dataKey="planned" name="ኢላማ" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="actual" name="አፈጻጸም" radius={[6, 6, 0, 0]}>
                              {performanceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card className="shadow-sm border-slate-200 rounded-2xl bg-white flex flex-col p-5">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-5 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" /> ዝርዝር ትንተና
                      </h3>
                      <ScrollArea className="flex-1">
                        <div className="space-y-4">
                          {performanceData.map((metric, i) => (
                            <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <div className="flex items-center justify-between mb-2.5">
                                <span className="text-[10px] font-black text-slate-900">{metric.serviceName}</span>
                                <Badge className="text-[8px] font-black text-white" style={{ backgroundColor: metric.color }}>{metric.execution}%</Badge>
                              </div>
                              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${metric.execution}%`, backgroundColor: metric.color }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="daily-log" className="h-full m-0 flex flex-col">
                  <Card className="flex-1 shadow-sm border-slate-200 rounded-2xl bg-white overflow-hidden flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
                      <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                        <History className="w-4 h-4 text-[#1e3a8a]" /> የቀን ውሎ መመዝገቢያ (Daily Activity)
                      </h3>
                      <Badge className="bg-white text-slate-900 border-slate-200 text-[9px] font-black">{new Date().toLocaleDateString('am-ET')}</Badge>
                    </div>
                    <ScrollArea className="flex-1">
                      <Table>
                        <TableHeader className="bg-slate-50/80">
                          <TableRow>
                            <TableHead className="text-[9px] font-black uppercase">ሰራተኛ (Expert)</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">ዘርፍ/ቡድን</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">ተግባር/ፋይል</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">ሰዓት</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-right">ርክክብ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uploadedFiles.map((file) => (
                            <TableRow key={file.id} className="hover:bg-slate-50/50">
                              <TableCell className="text-[10px] font-black">{file.expertName}</TableCell>
                              <TableCell className="text-[10px] text-slate-600 font-medium">{file.sector} / {file.team}</TableCell>
                              <TableCell className="text-[10px] font-bold text-slate-800">{file.name}</TableCell>
                              <TableCell className="text-[9px] text-slate-400 font-bold">{file.uploadDate ? new Date(file.uploadDate).toLocaleTimeString('am-ET') : '--'}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white hover:shadow-sm rounded-xl" onClick={() => handleOpenFile(file.fileUrl)}>
                                  <Eye className="w-4 h-4 text-[#1e3a8a]" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </Card>
                </TabsContent>

                <TabsContent value="feedback" className="h-full m-0 flex flex-col gap-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-full">
                    <Card className="md:col-span-2 shadow-sm border-slate-200 rounded-2xl bg-white flex flex-col overflow-hidden">
                      <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-[#1e3a8a]" /> የአመራርና የሰራተኞች ዳሽ ቦርድ
                        </h3>
                      </div>
                      <ScrollArea className="flex-1 p-5">
                        <div className="space-y-5">
                          {feedbackMessages.map((msg) => (
                            <div key={msg.id} className="flex gap-4">
                              <Avatar className="w-9 h-9 border border-slate-100 shadow-sm">
                                <AvatarFallback className="bg-slate-100 text-[11px] font-black text-[#1e3a8a]">{msg.senderName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[11px] font-black text-slate-900">{msg.senderName}</span>
                                  <Badge className="text-[8px] font-black h-4 px-2 bg-[#1e3a8a]/5 text-[#1e3a8a] border-none uppercase tracking-widest">{msg.senderRole}</Badge>
                                  <span className="text-[9px] text-slate-400 font-bold ml-auto">{new Date(msg.timestamp).toLocaleString('am-ET')}</span>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100 relative group hover:bg-white hover:shadow-md transition-all duration-300">
                                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{msg.content}</p>
                                  {(isAdmin || msg.uploaderId === user?.uid) && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-lg"
                                      onClick={() => deleteDocumentNonBlocking(doc(db!, 'feedback', msg.id))}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="p-5 bg-white border-t space-y-4 shadow-2xl">
                        <div className="relative">
                          <Textarea 
                            value={feedbackInput} 
                            onChange={(e) => setFeedbackInput(e.target.value)} 
                            placeholder="አዲስ መመሪያ ወይም ሪፖርት እዚህ ይጻፉ... (Institutional Editor)" 
                            className="bg-slate-50 border-none rounded-2xl text-xs min-h-[140px] shadow-inner p-5 font-medium focus:ring-0 focus:bg-white transition-colors"
                          />
                          <Button className="absolute bottom-4 right-4 h-10 px-8 rounded-xl bg-[#1e3a8a] text-white font-black text-[11px] shadow-xl hover:scale-105 transition-transform" onClick={handleSendFeedback}>
                            <Send className="w-5 h-5 mr-2.5" /> መዝግብ (Post)
                          </Button>
                        </div>
                      </div>
                    </Card>

                    <Card className="shadow-sm border-slate-200 rounded-2xl bg-white p-5 flex flex-col">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-5 flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-600" /> ንቁ ተጠቃሚዎች
                      </h3>
                      <div className="space-y-4">
                        {user ? (
                          <div className="flex items-center gap-3 p-3 rounded-2xl bg-green-50 border border-green-100 shadow-sm">
                            <Avatar className="w-9 h-9 border-2 border-white shadow-sm">
                               <AvatarFallback className="bg-green-200 text-green-700 text-[11px] font-black">{user?.displayName?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-900 truncate max-w-[120px]">{user?.displayName || user?.email?.split('@')[0]}</span>
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-[9px] text-green-600 font-black uppercase tracking-wider">Online</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-10 text-center opacity-20 font-bold text-xs uppercase">ማንም የለም</div>
                        )}
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>

      <footer className="px-6 py-2 bg-white border-t border-slate-200 flex justify-between items-center shrink-0 shadow-inner">
        <div className="flex gap-5 items-center text-[9px] font-black uppercase text-slate-400 tracking-widest">
          <span>ITB Enterprise v4.3.0</span>
          <span className="text-slate-200">|</span>
          <Link href="/admin" className="text-[#1e3a8a] hover:underline transition-colors">ADMIN CONTROL CENTER</Link>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Secure System Online</span>
        </div>
      </footer>
    </div>
  );
}
