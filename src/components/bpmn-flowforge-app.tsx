
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
  BrainCircuit,
  TrendingUp,
  CheckCircle2,
  Save,
  FileCode,
  ChevronDown,
  LayoutIcon,
  FileSearch,
  Zap,
  Eye,
  Users,
  History,
  MessageSquare,
  Send,
  LogOut,
  LogIn,
  XCircle,
  FileJson,
  LayoutTemplate
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Line,
  LineChart
} from 'recharts';
import { 
  useCollection, 
  useUser, 
  useFirestore, 
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking,
  useAuth,
  useDoc
} from '@/firebase';
import { collection, query, doc, Timestamp, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface UploadedFile {
  id: string;
  name: string;
  category: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  dataUrl: string;
  fileUrl: string; 
  type: string;
  status: 'የጸደቀ' | 'በሂደት ላይ';
  version: number;
  uploaderId: string;
  expertName?: string;
  createdAt?: any;
  sector?: string;
}

interface FeedbackMessage {
  id: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  uploaderId: string;
  createdAt?: any;
}

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [feedbackInput, setFeedbackInput] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  const viewerRef = useRef<BPMNViewerRef>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    setMounted(true);
    setCurrentDate(new Date().toLocaleDateString('am-ET'));
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

  const filteredDocuments = useMemo(() => {
    let list = uploadedFiles || [];
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.expertName?.toLowerCase().includes(q) ||
        item.sector?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [uploadedFiles, globalSearch]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const handleGenerate = () => {
    if (!input.trim()) return;
    const result = generateBPMN(input, title || "የሂደት ዲያግራም");
    if (result) {
      setXmlResult(result);
      setActiveTab("diagram");
      toast({ title: "ተሳክቷል", description: "ካርታው ተዘጋጅቷል" });
    }
  };

  const handleAutoSuggest = async (docType: 'diagram' | 'analysis' = 'diagram') => {
    setIsSuggesting(true);
    try {
      const result = await suggestSteps({ title: title || "አዲስ ስራ", docType, vaultContext: uploadedFiles });
      if (result?.steps) setInput(result.steps);
      if (docType === 'analysis') setActiveTab('dashboard');
    } catch (error) {
      toast({ title: "ስህተት", description: "AI ምላሽ መስጠት አልቻለም", variant: "destructive" });
    } finally { setIsSuggesting(false); }
  };

  const handleSaveToVault = async () => {
    if (!user || !db) return router.push('/login');
    const currentXml = await viewerRef.current?.getXML() || xmlResult;
    if (!currentXml) return;
    setIsSaving(true);
    try {
      const blob = new Blob([currentXml], { type: 'application/xml' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUri = reader.result as string;
        const newFile: Omit<UploadedFile, 'id'> = {
          name: title || "BPMN Diagram",
          category: 'BPMN Diagram',
          fileName: `${(title || "diagram").replace(/\s+/g, '-')}.bpmn`,
          fileSize: "BPMN",
          uploadDate: new Date().toISOString(),
          dataUrl: dataUri,
          fileUrl: dataUri,
          type: 'application/xml',
          status: 'በሂደት ላይ',
          version: 1,
          uploaderId: user.uid,
          expertName: user.displayName || "ባለሙያ",
          sector: "ITB Sector",
          createdAt: Timestamp.now()
        };
        await addDocumentNonBlocking(collection(db, 'documents'), newFile);
        toast({ title: "ተቀምጧል", description: "መዝገብ ቤት ገብቷል" });
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      toast({ title: "ስህተት", description: "ማስቀመጥ አልተቻለም", variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  const processUpload = () => {
    if (!selectedFile || !user || !db) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const newFile: Omit<UploadedFile, 'id'> = {
        name: selectedFile.name.split('.')[0],
        category: uploadCategory || "ሌሎች",
        sector: uploadSector || "General",
        expertName: user.displayName || "ባለሙያ",
        fileName: selectedFile.name,
        fileSize: (selectedFile.size / 1024).toFixed(1) + " KB",
        uploadDate: new Date().toISOString(),
        dataUrl,
        fileUrl: dataUrl,
        type: selectedFile.type,
        status: 'በሂደት ላይ',
        version: 1,
        uploaderId: user.uid,
        createdAt: Timestamp.now()
      };
      await addDocumentNonBlocking(collection(db, 'documents'), newFile);
      setIsUploading(false); setIsUploadOpen(false); setSelectedFile(null);
      toast({ title: "ተመዝግቧል", description: "መዝገብ ቤት ገብቷል" });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSendFeedback = async () => {
    if (!feedbackInput.trim() || !user || !db) return;
    const newFeedback: Omit<FeedbackMessage, 'id'> = {
      senderName: user.displayName || "ተጠቃሚ",
      senderRole: isAdmin ? "Admin" : "Staff",
      content: feedbackInput,
      timestamp: new Date().toISOString(),
      uploaderId: user.uid,
      createdAt: Timestamp.now()
    };
    await addDocumentNonBlocking(collection(db, 'feedback'), newFeedback);
    setFeedbackInput("");
    toast({ title: "ተልኳል", description: "መልዕክቱ ተመዝግቧል" });
  };

  const handleDownloadFile = (file: UploadedFile) => {
    if (!file.fileUrl) return;
    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenFile = (url: string) => {
    if (!url) return;
    const win = window.open();
    if (win) {
      if (url.startsWith('data:')) {
        win.document.write(`<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      } else win.location.href = url;
    }
  };

  const handleApprove = (id: string) => {
    if (db && isAdmin) {
      updateDocumentNonBlocking(doc(db, 'documents', id), { status: 'የጸደቀ' });
      toast({ title: "ጸድቋል", description: "ሰነዱ በትክክል ጸድቋል" });
    }
  };

  const handleDelete = (id: string, uploaderId: string) => {
    if (db && (isAdmin || uploaderId === user?.uid)) {
      deleteDocumentNonBlocking(doc(db, 'documents', id));
      toast({ title: "ተሰርዟል", description: "ሰነዱ ተሰርዟል" });
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#1e3a8a] rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md">
            ITB
          </div>
          <div>
            <h1 className="text-lg font-black text-[#1e3a8a] tracking-tight">የኢኖቬሽንና ቴክኖሎጂ ቢሮ</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Innovation & Technology Bureau</p>
          </div>
        </div>
        
        <div className="flex-1 max-w-xl mx-8 relative">
          <Input value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="መዝገብ ቤት ፈልግ..." className="h-10 text-xs pl-10 rounded-2xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-[#1e3a8a]/20" />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-2xl gap-2 p-1.5 hover:bg-slate-100">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-900 leading-none">{user.displayName || user.email?.split('@')[0]}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">{isAdmin ? 'አስተዳዳሪ' : 'ባለሙያ'}</p>
                  </div>
                  <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-[#1e3a8a] text-white text-[10px] font-black">{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-none">
                <DropdownMenuLabel className="text-[10px] uppercase font-black px-4 text-slate-400">መቆጣጠሪያ</DropdownMenuLabel>
                {isAdmin && (
                  <DropdownMenuItem asChild><Link href="/admin" className="flex items-center w-full p-3 rounded-xl font-bold text-xs"><ShieldCheck className="w-4 h-4 mr-2" /> የአስተዳዳሪ ገጽ</Link></DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 font-bold p-3 rounded-xl cursor-pointer"><LogOut className="w-4 h-4 mr-2" /> ውጣ (Logout)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="rounded-2xl bg-[#1e3a8a] font-black text-xs px-6 h-10"><Link href="/login">ይግቡ</Link></Button>
          )}
        </div>
      </header>

      <main className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left Sidebar - AI and Archive */}
        <div className="w-[420px] flex flex-col gap-4 overflow-hidden">
          <Card className="shadow-xl border-none rounded-[2rem] overflow-hidden shrink-0 bg-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-[#1e3a8a]" /> AI ረዳት
                </h2>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => {setInput(""); setTitle("");}} className="h-8 text-[9px] font-black text-red-500 rounded-xl"><XCircle className="w-3.5 h-3.5" /></Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="h-8 text-[9px] font-black bg-[#1e3a8a] rounded-xl px-4">{isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'አመንጭ'}</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="rounded-xl p-2 w-56">
                      <DropdownMenuItem onClick={() => handleAutoSuggest('diagram')} className="text-xs font-bold p-3 cursor-pointer"><LayoutTemplate className="w-4 h-4 mr-2" /> አዲስ ስራ ፍሰት</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAutoSuggest('analysis')} className="text-xs font-bold p-3 cursor-pointer"><FileSearch className="w-4 h-4 mr-2 text-green-600" /> መዝገብ ቤት ትንተና</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="space-y-3">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="የአገልግሎት ስም..." className="h-12 rounded-xl bg-slate-50 border-none font-bold text-xs" />
                <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="ዝርዝር ተግባራት እዚህ ይጻፉ..." className="min-h-[140px] rounded-xl bg-slate-50 border-none text-xs leading-relaxed font-medium" />
                <div className="flex gap-2">
                  <Button className="flex-1 h-12 bg-[#1e3a8a] rounded-xl font-black text-xs shadow-lg" onClick={handleGenerate}>ካርታ አሳይ</Button>
                  <Button variant="outline" className="flex-1 h-12 border-slate-200 rounded-xl font-black text-xs" onClick={handleSaveToVault} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} መዝግብ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 shadow-xl border-none rounded-[2rem] overflow-hidden bg-white flex flex-col">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
              <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> መዝገብ ቤት (Vault)</h3>
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild><Button size="sm" className="h-8 rounded-xl bg-slate-900 text-[9px] font-black"><Upload className="w-3 h-3 mr-1" /> ፋይል መዝግብ</Button></DialogTrigger>
                <DialogContent className="max-w-md rounded-[2.5rem] p-8">
                  <DialogHeader><DialogTitle className="font-black text-xl">አዲስ ፋይል መመዝገቢያ</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} placeholder="የፋይሉ አይነት (ለምሳሌ እቅድ)..." className="h-12 rounded-xl" />
                    <Input value={uploadSector} onChange={(e) => setUploadSector(e.target.value)} placeholder="ዘርፍ (Sector)..." className="h-12 rounded-xl" />
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                      <Upload className="w-8 h-8 text-slate-300 mb-2" />
                      <span className="text-xs font-black text-slate-500 uppercase">{selectedFile ? selectedFile.name : "ፋይል ይምረጡ"}</span>
                      <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <Button className="w-full h-14 bg-[#1e3a8a] rounded-2xl font-black uppercase shadow-xl" onClick={processUpload} disabled={isUploading || !selectedFile}>{isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "አጽድቅና መዝግብ"}</Button>
                </DialogContent>
              </Dialog>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {isDocsLoading ? (
                  <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-200" /></div>
                ) : filteredDocuments.map(file => (
                  <div key={file.id} className="group p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#1e3a8a]/10 group-hover:text-[#1e3a8a] transition-all"><FileText className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[11px] font-black text-slate-900 leading-tight">{file.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{file.expertName} • {file.sector}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenFile(file.fileUrl)} className="h-8 w-8 rounded-lg text-blue-600 hover:bg-blue-50"><Eye className="w-4 h-4" /></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreVertical className="w-4 h-4 text-slate-400" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-2xl shadow-2xl p-2 border-none">
                          {(isAdmin && file.status !== 'የጸደቀ') && (
                            <DropdownMenuItem onClick={() => handleApprove(file.id)} className="text-xs font-bold p-3 rounded-xl cursor-pointer bg-green-50 text-green-700 mb-1"><CheckCircle2 className="w-4 h-4 mr-2" /> አጽድቅ</DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDownloadFile(file)} className="text-xs font-bold p-3 rounded-xl cursor-pointer"><Download className="w-4 h-4 mr-2" /> አውርድ</DropdownMenuItem>
                          {(isAdmin || file.uploaderId === user?.uid) && (
                            <DropdownMenuItem onClick={() => handleDelete(file.id, file.uploaderId)} className="text-xs font-bold p-3 rounded-xl cursor-pointer text-red-600 bg-red-50"><Trash2 className="w-4 h-4 mr-2" /> ሰርዝ</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Right Content - Tabs */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex items-center justify-between bg-white border p-1.5 h-12 rounded-2xl shadow-sm shrink-0">
              <TabsList className="bg-transparent border-none gap-2">
                <TabsTrigger value="diagram" className="text-[10px] font-black px-6 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">ዲያግራም</TabsTrigger>
                <TabsTrigger value="dashboard" className="text-[10px] font-black px-6 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">አፈጻጸምና ትንተና</TabsTrigger>
                <TabsTrigger value="daily-log" className="text-[10px] font-black px-6 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">የቀን ውሎ</TabsTrigger>
                <TabsTrigger value="feedback" className="text-[10px] font-black px-6 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">ዳሽቦርድ (Chat)</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2 pr-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 rounded-xl font-black text-[9px] uppercase border-slate-200">
                      <Download className="w-3.5 h-3.5 mr-2" /> አውርድ
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-xl p-2 w-48">
                    <DropdownMenuItem onClick={() => viewerRef.current?.exportSVG()} className="text-xs font-bold p-3 cursor-pointer"><FileCode className="w-4 h-4 mr-2 text-orange-500" /> በ SVG አውርድ</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => viewerRef.current?.exportXML()} className="text-xs font-bold p-3 cursor-pointer"><FileJson className="w-4 h-4 mr-2 text-blue-500" /> በ BPMN አውርድ</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => viewerRef.current?.exportPNG()} className="text-xs font-bold p-3 cursor-pointer"><Image className="w-4 h-4 mr-2 text-green-500" /> በ ምስል (PNG) አውርድ</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex-1 mt-4 min-h-0 overflow-hidden">
              <TabsContent value="diagram" className="h-full m-0">
                <Card className="h-full rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white relative">
                  {xmlResult ? (
                    <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 select-none">
                      <LayoutTemplate className="w-32 h-32 text-slate-300" />
                      <p className="text-xl font-black uppercase tracking-widest mt-6 text-slate-400">ዲያግራም አልተመረጠም</p>
                    </div>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="dashboard" className="h-full m-0 overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  <Card className="shadow-xl border-none rounded-[2.5rem] bg-white p-8 flex flex-col">
                    <h3 className="text-[11px] font-black uppercase tracking-widest mb-8 flex items-center gap-3"><BarChart className="w-6 h-6 text-[#1e3a8a]" /> አጠቃላይ አፈጻጸም</h3>
                    <div className="flex-1 min-h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={uploadedFiles.slice(0, 10).map(f => ({ name: f.name.substring(0, 10), val: f.status === 'የጸደቀ' ? 100 : 65 }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" fontSize={9} fontWeight="bold" />
                          <YAxis fontSize={9} fontWeight="bold" />
                          <RechartsTooltip />
                          <Line type="monotone" dataKey="val" stroke="#1e3a8a" strokeWidth={4} dot={{ fill: '#1e3a8a', r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  
                  <Card className="shadow-xl border-none rounded-[2.5rem] bg-white p-8 flex flex-col">
                    <h3 className="text-[11px] font-black uppercase tracking-widest mb-8 flex items-center gap-3"><TrendingUp className="w-6 h-6 text-green-600" /> ዝርዝር AI ትንተና</h3>
                    <ScrollArea className="flex-1">
                      <div className="space-y-6">
                        <div className="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">ትኩረት የሚሹ ጉዳዮች (Focus Areas)</h4>
                          <ul className="space-y-3">
                            <li className="flex gap-3 text-xs font-medium"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> የሂደት ማኑዋል ዝግጅት መፋጠን አለበት</li>
                            <li className="flex gap-3 text-xs font-medium"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> የባለሙያዎች የክህሎት ክፍተት ጥናት ተጠናቋል</li>
                            <li className="flex gap-3 text-xs font-medium"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> የዳታ ማዕከል ደህንነት ፍተሻ ውጤት ዝቅተኛ ነው</li>
                          </ul>
                        </div>
                        <Button className="w-full h-14 rounded-2xl bg-slate-900 font-black text-xs shadow-xl"><Download className="w-4 h-4 mr-2" /> ሙሉ ትንተናውን በ Word አውርድ</Button>
                      </div>
                    </ScrollArea>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="daily-log" className="h-full m-0">
                <Card className="h-full shadow-xl border-none rounded-[2.5rem] bg-white overflow-hidden flex flex-col">
                  <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><History className="w-4 h-4 text-[#1e3a8a]" /> የቀን ውሎ መመዝገቢያ</h3>
                    <Badge className="bg-white text-slate-900 border-slate-200 text-[10px] font-black px-4 py-1.5 rounded-full">{currentDate}</Badge>
                  </div>
                  <ScrollArea className="flex-1">
                    <Table>
                      <TableHeader className="bg-slate-50/80">
                        <TableRow className="border-none">
                          <TableHead className="text-[9px] font-black uppercase px-6">ሰራተኛ</TableHead>
                          <TableHead className="text-[9px] font-black uppercase px-6">ተግባር/ፋይል</TableHead>
                          <TableHead className="text-[9px] font-black uppercase px-6">ሁኔታ</TableHead>
                          <TableHead className="text-[9px] font-black uppercase px-6 text-right">እርምጃ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uploadedFiles.map(f => (
                          <TableRow key={f.id} className="hover:bg-slate-50/50 border-slate-50">
                            <TableCell className="px-6 py-4 text-[10px] font-black">{f.expertName || 'ባለሙያ'}</TableCell>
                            <TableCell className="px-6 py-4 text-[10px] font-medium">{f.name}</TableCell>
                            <TableCell className="px-6 py-4">
                              <Badge variant="outline" className={`text-[8px] border-none px-3 py-1 font-black ${f.status === 'የጸደቀ' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{f.status}</Badge>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-right">
                              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg hover:bg-blue-50" onClick={() => handleOpenFile(f.fileUrl)}><Eye className="w-4 h-4 text-[#1e3a8a]" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </Card>
              </TabsContent>

              <TabsContent value="feedback" className="h-full m-0 flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
                  <Card className="md:col-span-3 shadow-2xl border-none rounded-[2.5rem] bg-white flex flex-col overflow-hidden">
                    <div className="p-6 border-b bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md">ITB</div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">የአመራርና የሰራተኞች መፃፃፊያ</h3>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">ተቋማዊ መስመር (WhatsApp Style)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <ScrollArea className="flex-1 p-6">
                      <div className="space-y-6">
                        {feedbackMessages.map(msg => (
                          <div key={msg.id} className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 ${msg.uploaderId === user?.uid ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="w-10 h-10 border-2 border-white shadow-md">
                              <AvatarFallback className={`${msg.uploaderId === user?.uid ? 'bg-slate-900' : 'bg-[#1e3a8a]'} text-white text-[11px] font-black uppercase`}>{msg.senderName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className={`max-w-[70%] ${msg.uploaderId === user?.uid ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase">{msg.senderName}</span>
                                <span className="text-[8px] font-bold text-slate-300">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <div className={`${msg.uploaderId === user?.uid ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'} p-4 rounded-3xl shadow-sm`}>
                                <p className="text-xs font-medium leading-relaxed">{msg.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="p-6 bg-white border-t">
                      <div className="relative group">
                        <Textarea 
                          value={feedbackInput} 
                          onChange={(e) => setFeedbackInput(e.target.value)} 
                          placeholder="መልዕክት እዚህ ይጻፉ..." 
                          className="bg-slate-50 border-none rounded-[1.5rem] text-xs min-h-[100px] p-5 shadow-inner focus-visible:ring-1 focus-visible:ring-[#1e3a8a]/20 font-medium resize-none" 
                        />
                        <Button className="absolute bottom-4 right-4 h-11 px-8 rounded-xl bg-[#1e3a8a] text-white font-black text-xs shadow-xl" onClick={handleSendFeedback}>
                          <Send className="w-4 h-4 mr-2" /> ላክ
                        </Button>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="shadow-xl border-none rounded-[2.5rem] bg-white p-6 flex flex-col overflow-hidden">
                    <h3 className="text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-green-600" /> ንቁ ሰራተኞች</h3>
                    <ScrollArea className="flex-1">
                      <div className="space-y-4">
                        {user ? (
                          <div className="flex items-center gap-3 p-3 rounded-2xl bg-green-50 border border-green-100 shadow-sm">
                            <div className="relative">
                              <Avatar className="w-10 h-10 border-2 border-white shadow-md"><AvatarFallback className="bg-green-500 text-white font-black">{user.email?.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-800 truncate max-w-[100px]">{user.displayName || user.email?.split('@')[0]}</span>
                              <span className="text-[8px] text-green-600 font-black uppercase tracking-widest">መስመር ላይ</span>
                            </div>
                          </div>
                        ) : <p className="text-[10px] font-bold text-slate-300 uppercase p-4">ምንም ተጠቃሚ የለም</p>}
                      </div>
                    </ScrollArea>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      <footer className="px-6 py-2.5 bg-white border-t flex justify-between items-center shrink-0">
        <div className="flex gap-4 items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
          <span>Worku ITB Enterprise v4.9.5</span>
          <span className="text-slate-200">|</span>
          <span className="text-[#1e3a8a]">መዝገብ ቤት - የተረጋገጠ መስመር</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-green-50 rounded-full border border-green-100 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">ንቁ የደህንነት ስርዓት</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
