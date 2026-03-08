
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
  BrainCircuit,
  TrendingUp,
  CheckCircle2,
  Save,
  FileCode,
  LayoutTemplate,
  Zap,
  History,
  MessageSquare,
  Send,
  LogOut,
  XCircle,
  FileJson,
  ShieldCheck,
  Image as ImageIcon,
  Share2,
  Heart,
  CalendarDays,
  Menu,
  FileCheck
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  ResponsiveContainer, 
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area
} from 'recharts';
import { 
  useCollection, 
  useUser, 
  useFirestore, 
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useAuth
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
  fileUrl: string; 
  type: string;
  status: string;
  uploaderId: string;
  expertName?: string;
  sector?: string;
  createdAt?: any;
}

interface SocialPost {
  id: string;
  authorName: string;
  authorPosition: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
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
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadSector, setUploadSector] = useState("");
  const [socialInput, setSocialInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [selectedSocialImage, setSelectedSocialImage] = useState<string | null>(null);

  const viewerRef = useRef<BPMNViewerRef>(null);
  const socialFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    setMounted(true);
  }, []);

  const documentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
  }, [db]);

  const socialQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'social_posts'), orderBy('createdAt', 'desc'));
  }, [db]);

  const feedbackQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: uploadedFilesRaw, isLoading: isDocsLoading } = useCollection<UploadedFile>(documentsQuery);
  const { data: socialPostsRaw } = useCollection<SocialPost>(socialQuery);
  const { data: feedbackMessagesRaw } = useCollection<any>(feedbackQuery);
  
  const uploadedFiles = uploadedFilesRaw || [];
  const socialPosts = socialPostsRaw || [];
  const feedbackMessages = feedbackMessagesRaw || [];

  const filteredDocuments = useMemo(() => {
    if (!globalSearch.trim()) return uploadedFiles;
    const q = globalSearch.toLowerCase();
    return uploadedFiles.filter(f => 
      f.name.toLowerCase().includes(q) || 
      f.expertName?.toLowerCase().includes(q) ||
      f.sector?.toLowerCase().includes(q)
    );
  }, [uploadedFiles, globalSearch]);

  const statsData = useMemo(() => {
    return uploadedFiles.slice(0, 10).reverse().map((f, i) => ({
      name: f.name.substring(0, 6),
      efficiency: f.status === 'የጸደቀ' ? 95 : 65 + (i * 3),
      progress: 70 + (i * 2)
    }));
  }, [uploadedFiles]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const handleGenerate = () => {
    if (!input.trim()) {
      toast({ title: "መረጃ ይጎድላል", description: "እባክዎ የሂደት ተግባራትን ይጻፉ", variant: "destructive" });
      return;
    }
    const result = generateBPMN(input, title || "የሂደት ዲያግራም");
    if (result) {
      setXmlResult(result);
      setActiveTab("diagram");
      toast({ title: "ተሳክቷል", description: "ካርታው ተዘጋጅቷል" });
    }
  };

  const handleManualUpload = async () => {
    if (!selectedFile || !user || !db) return;
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUri = reader.result as string;
        const newFile: Omit<UploadedFile, 'id'> = {
          name: selectedFile.name.split('.')[0],
          category: uploadCategory || 'ሰነድ',
          fileName: selectedFile.name,
          fileSize: `${(selectedFile.size / 1024).toFixed(1)} KB`,
          uploadDate: new Date().toISOString(),
          fileUrl: dataUri,
          type: selectedFile.type,
          status: 'በሂደት ላይ',
          uploaderId: user.uid,
          expertName: user.displayName || "ባለሙያ",
          sector: uploadSector || "አጠቃላይ",
          createdAt: Timestamp.now()
        };
        await addDocumentNonBlocking(collection(db, 'documents'), newFile);
        setIsUploadOpen(false);
        setSelectedFile(null);
        toast({ title: "ተሳክቷል", description: "ፋይሉ በትክክል ተመዝግቧል" });
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      toast({ title: "ስህተት", description: "ፋይሉን መጫን አልተቻለም", variant: "destructive" });
    } finally { setIsUploading(false); }
  };

  const handleSaveToVault = async () => {
    if (!user || !db) return;
    const currentXml = await viewerRef.current?.getXML() || xmlResult;
    if (!currentXml) return;
    setIsSaving(true);
    try {
      const blob = new Blob([currentXml], { type: 'application/xml' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUri = reader.result as string;
        await addDocumentNonBlocking(collection(db, 'documents'), {
          name: title || "BPMN Diagram",
          category: 'BPMN Diagram',
          fileName: `${(title || "diagram").replace(/\s+/g, '-')}.bpmn`,
          fileSize: "BPMN",
          uploadDate: new Date().toISOString(),
          fileUrl: dataUri,
          type: 'application/xml',
          status: 'በሂደት ላይ',
          uploaderId: user.uid,
          expertName: user.displayName || "ባለሙያ",
          sector: "ቴክኖሎጂ",
          createdAt: Timestamp.now()
        });
        toast({ title: "ተቀምጧል", description: "ዲያግራሙ መዝገብ ቤት ገብቷል" });
      };
      reader.readAsDataURL(blob);
    } finally { setIsSaving(false); }
  };

  const handlePostSocial = async () => {
    if (!socialInput.trim() && !selectedSocialImage) return;
    if (!user || !db) return;
    try {
      await addDocumentNonBlocking(collection(db, 'social_posts'), {
        authorName: user.displayName || "ባለሙያ",
        authorPosition: "ITB Member",
        content: socialInput,
        imageUrl: selectedSocialImage || undefined,
        likes: 0,
        comments: 0,
        timestamp: new Date().toISOString(),
        uploaderId: user.uid,
        createdAt: Timestamp.now()
      });
      setSocialInput("");
      setSelectedSocialImage(null);
    } catch (e) { toast({ title: "ስህተት", description: "መለጠፍ አልተቻለም" }); }
  };

  const handleSendFeedback = async () => {
    if (!feedbackInput.trim() || !user || !db) return;
    try {
      await addDocumentNonBlocking(collection(db, 'feedback'), {
        senderName: user.displayName || "ባለሙያ",
        content: feedbackInput,
        timestamp: new Date().toISOString(),
        uploaderId: user.uid,
        createdAt: Timestamp.now()
      });
      setFeedbackInput("");
    } catch (e) { toast({ title: "ስህተት", description: "መልዕክቱ አልተላከም" }); }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* NARROW INSTITUTIONAL HEADER */}
      <header className="flex items-center justify-between px-6 bg-white border-b shrink-0 shadow-sm z-50 h-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1e3a8a] rounded-lg flex items-center justify-center shadow-md overflow-hidden ring-2 ring-white">
             <Avatar className="h-full w-full">
                <AvatarFallback className="bg-[#1e3a8a] text-white text-[9px] font-black">ITB</AvatarFallback>
             </Avatar>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[11px] font-black text-[#1e3a8a] tracking-tight uppercase leading-none">የኢኖቬሽንና ቴክኖሎጂ ቢሮ</h1>
            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ITB Innovation Portal</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-sm mx-6 relative hidden md:block">
          <Input value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="መዝገብ ቤት ፈልግ..." className="h-7 text-[9px] pl-8 rounded-full bg-slate-50 border-none shadow-inner" />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-900 leading-none">{user.displayName || "ባለሙያ"}</span>
                <span className="text-[7px] font-bold text-green-600 uppercase mt-0.5">Online</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full p-0 h-8 w-8 border-2 border-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
                    <Avatar className="h-full w-full">
                      <AvatarFallback className="bg-[#1e3a8a] text-white text-[10px] font-black">{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-none">
                  <DropdownMenuLabel className="text-[9px] uppercase font-black px-4 text-slate-400 py-2">አስተዳደር</DropdownMenuLabel>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center w-full p-2.5 rounded-xl font-bold text-[11px] hover:bg-slate-50">
                        <ShieldCheck className="w-3.5 h-3.5 mr-2 text-blue-600" /> የአስተዳዳሪ ገጽ
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setActiveTab("dashboard")} className="p-2.5 rounded-xl font-bold text-[11px] hover:bg-slate-50 cursor-pointer">
                    <History className="w-3.5 h-3.5 mr-2 text-slate-400" /> እንቅስቃሴዎች
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-50" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 font-bold p-2.5 rounded-xl cursor-pointer hover:bg-red-50">
                    <LogOut className="w-3.5 h-3.5 mr-2" /> ውጣ (Logout)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button asChild className="rounded-full bg-[#1e3a8a] font-black text-[9px] px-5 h-7 uppercase shadow-md"><Link href="/login">ይግቡ</Link></Button>
          )}
        </div>
      </header>

      <main className="flex-1 flex gap-2 p-2 overflow-hidden">
        {/* LEFT COLUMN: ARCHITECT & RECENT */}
        <div className="w-[320px] flex flex-col gap-2 overflow-hidden">
          <Card className="shadow-lg border-none rounded-[1.5rem] bg-white overflow-hidden shrink-0 border-t-4 border-[#1e3a8a]">
            <CardContent className="p-4 space-y-3">
              <h2 className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                <BrainCircuit className="w-3 h-3 text-[#1e3a8a]" /> AI ካርታ ሰሪ (Architect)
              </h2>
              <div className="space-y-2">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="የሂደት ስም..." className="h-8 rounded-lg bg-slate-50 border-none font-bold text-[10px]" />
                <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="ተግባራት እዚህ ይጻፉ..." className="min-h-[80px] rounded-lg bg-slate-50 border-none text-[10px] leading-relaxed font-medium resize-none shadow-inner" />
                <div className="flex gap-2">
                  <Button className="flex-1 h-8 bg-[#1e3a8a] rounded-lg font-black text-[9px] shadow-md uppercase" onClick={handleGenerate}>ካርታ አሳይ</Button>
                  <Button variant="outline" className="flex-1 h-8 border-slate-200 rounded-lg font-black text-[9px] uppercase" onClick={handleSaveToVault} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} መዝግብ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 shadow-lg border-none rounded-[1.5rem] bg-white flex flex-col overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between bg-slate-50/50">
              <h3 className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><FileText className="w-3 h-3 text-slate-400" /> መዝገብ ቤት (Vault)</h3>
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild><Button size="sm" className="h-6 rounded-md bg-slate-900 text-[8px] font-black uppercase"><Upload className="w-3 h-3 mr-1" /> መዝግብ</Button></DialogTrigger>
                <DialogContent className="max-w-md rounded-[2rem] p-6 border-none shadow-2xl">
                  <DialogHeader><DialogTitle className="font-black text-lg text-[#1e3a8a]">ፋይል መመዝገቢያ</DialogTitle></DialogHeader>
                  <div className="space-y-3 py-4">
                    <Input value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} placeholder="የፋይሉ አይነት..." className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs" />
                    <Input value={uploadSector} onChange={(e) => setUploadSector(e.target.value)} placeholder="የስራ ዘርፍ..." className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs" />
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                      <Upload className="w-8 h-8 text-slate-300 mb-2" />
                      <span className="text-[10px] font-black text-slate-500 uppercase px-4 text-center">{selectedFile ? selectedFile.name : "ፋይል ይምረጡ"}</span>
                      <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <Button className="w-full h-10 bg-[#1e3a8a] rounded-xl font-black uppercase shadow-lg" onClick={handleManualUpload} disabled={isUploading || !selectedFile}>
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "አጽድቅና መዝግብ"}
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-1.5">
                {isDocsLoading ? (
                  <div className="p-10 text-center flex flex-col items-center gap-2"><Loader2 className="w-5 h-5 animate-spin text-slate-200" /></div>
                ) : filteredDocuments.map(file => (
                  <div key={file.id} className="group p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-[#1e3a8a]/10 group-hover:text-[#1e3a8a] transition-all shadow-sm"><FileText className="w-4 h-4" /></div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-900 leading-tight truncate">{file.name}</p>
                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest truncate">{file.expertName} • {file.sector}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => {
                        const link = document.createElement('a');
                        link.href = file.fileUrl;
                        link.download = file.fileName;
                        link.click();
                      }} className="h-7 w-7 rounded-lg text-blue-600 hover:bg-blue-50"><Download className="w-3.5 h-3.5" /></Button>
                      {(isAdmin || file.uploaderId === user?.uid) && (
                        <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db!, 'documents', file.id))} className="h-7 w-7 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* CENTER COLUMN: MAIN TABS */}
        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex items-center justify-between bg-white border p-1 h-10 rounded-xl shadow-sm shrink-0">
              <TabsList className="bg-transparent border-none gap-1">
                <TabsTrigger value="diagram" className="text-[9px] font-black px-4 h-7 rounded-lg uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">ካርታ</TabsTrigger>
                <TabsTrigger value="messenger" className="text-[9px] font-black px-4 h-7 rounded-lg uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">የቢሮ ሜሴንጀር</TabsTrigger>
                <TabsTrigger value="dashboard" className="text-[9px] font-black px-4 h-7 rounded-lg uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">አፈጻጸም ትንተና</TabsTrigger>
                <TabsTrigger value="social" className="text-[9px] font-black px-4 h-7 rounded-lg uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">ማህበራዊ ገጽ</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2 pr-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 rounded-lg font-black text-[9px] uppercase border-slate-200">
                      <Download className="w-3 h-3 mr-1" /> Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-xl p-1 w-48 shadow-2xl border-none">
                    <DropdownMenuItem onClick={() => viewerRef.current?.exportSVG()} className="text-[10px] font-bold p-2.5 cursor-pointer rounded-lg hover:bg-slate-50"><FileCode className="w-3.5 h-3.5 mr-2 text-orange-500" /> እንደ SVG አውርድ</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => viewerRef.current?.exportXML()} className="text-[10px] font-bold p-2.5 cursor-pointer rounded-lg hover:bg-slate-50"><FileJson className="w-3.5 h-3.5 mr-2 text-blue-500" /> እንደ BPMN አውርድ</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => viewerRef.current?.exportPNG()} className="text-[10px] font-bold p-2.5 cursor-pointer rounded-lg hover:bg-slate-50"><ImageIcon className="w-3.5 h-3.5 mr-2 text-green-500" /> እንደ PNG አውርድ</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex-1 mt-2 min-h-0 overflow-hidden">
              <TabsContent value="diagram" className="h-full m-0 outline-none">
                <Card className="h-full rounded-[2rem] border-none shadow-2xl overflow-hidden bg-white">
                  {xmlResult ? <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} /> : (
                    <div className="h-full flex flex-col items-center justify-center opacity-10 select-none">
                      <LayoutTemplate className="w-24 h-24 text-slate-300" />
                      <p className="text-[10px] font-black uppercase tracking-[0.5em] mt-6 text-slate-400">ዲያግራም አልተመረጠም</p>
                    </div>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="messenger" className="h-full m-0 flex flex-col gap-2 outline-none">
                <Card className="flex-1 shadow-2xl border-none rounded-[2rem] bg-white flex flex-col overflow-hidden">
                  <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#1e3a8a] rounded-xl flex items-center justify-center text-white font-black text-[10px] shadow-lg border-2 border-white">ITB</div>
                      <div>
                        <h3 className="text-[11px] font-black text-slate-900">የቢሮ መልዕክት መለዋወጫ</h3>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Active Bureau</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ScrollArea className="flex-1 p-5">
                    <div className="space-y-5">
                      {feedbackMessages.map(msg => (
                        <div key={msg.id} className={`flex gap-3 animate-in fade-in slide-in-from-bottom-1 ${msg.uploaderId === user?.uid ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="w-8 h-8 border shadow-sm shrink-0">
                            <AvatarFallback className={`${msg.uploaderId === user?.uid ? 'bg-slate-900' : 'bg-[#1e3a8a]'} text-white text-[9px] font-black`}>{msg.senderName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className={`max-w-[75%] ${msg.uploaderId === user?.uid ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">{msg.senderName}</span>
                            <div className={`${msg.uploaderId === user?.uid ? 'bg-[#1e3a8a] text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'} p-3 rounded-2xl shadow-sm relative group`}>
                              <p className="text-[11px] font-medium leading-relaxed">{msg.content}</p>
                              {(isAdmin || msg.uploaderId === user?.uid) && (
                                <button onClick={() => deleteDocumentNonBlocking(doc(db!, 'feedback', msg.id))} className="absolute -top-2 -right-2 bg-white text-red-500 p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <span className="text-[7px] text-slate-300 font-bold mt-0.5">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-3 bg-white border-t flex gap-2 px-5">
                    <Input value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendFeedback()} placeholder="መልዕክት እዚህ ይጻፉ..." className="h-9 bg-slate-50 border-none rounded-xl text-[10px]" />
                    <Button className="h-9 w-9 p-0 rounded-xl bg-[#1e3a8a] text-white shadow-lg active:scale-95 transition-all" onClick={handleSendFeedback}><Send className="w-4 h-4" /></Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="dashboard" className="h-full m-0 overflow-auto outline-none flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  <Card className="shadow-xl border-none rounded-[2rem] bg-white p-6 flex flex-col">
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2"><BarChart className="w-4 h-4 text-[#1e3a8a]" /> የቀን አፈጻጸም ግራፍ (Analysis)</h3>
                    <div className="flex-1 min-h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={statsData}>
                          <defs>
                            <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" fontSize={8} fontWeight="black" axisLine={false} tickLine={false} />
                          <YAxis fontSize={8} fontWeight="black" axisLine={false} tickLine={false} />
                          <RechartsTooltip />
                          <Area type="monotone" dataKey="efficiency" stroke="#1e3a8a" strokeWidth={3} fillOpacity={1} fill="url(#colorEff)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-[10px] font-black text-blue-800 uppercase">አጠቃላይ የአፈጻጸም ግምገማ</span>
                      </div>
                      <p className="text-[10px] font-medium text-blue-700 leading-relaxed">ባለፉት ቀናት በተከናወኑ ስራዎች ላይ የተገኘው አማካኝ ውጤት 87% ሲሆን፣ ይህም ካለፈው ሳምንት በ12% ጭማሪ አሳይቷል። አብዛኞቹ ሰነዶች በተቀመጠላቸው የጊዜ ገደብ ውስጥ ተጠናቀዋል።</p>
                    </div>
                  </Card>
                  
                  <Card className="shadow-xl border-none rounded-[2rem] bg-white p-6 flex flex-col">
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> ትኩረት የሚሹ ጉዳዮች (Narrative)</h3>
                    <ScrollArea className="flex-1">
                      <div className="space-y-4 pr-3">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <h4 className="text-[9px] font-black text-slate-500 uppercase mb-3">በAI የተተነተኑ ዋና ዋና ነጥቦች፦</h4>
                          <ul className="space-y-3">
                            <li className="flex gap-3 items-start animate-in slide-in-from-left-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                              <span className="text-[10px] font-bold text-slate-700 leading-tight">የዲጂታል ትራንስፎርሜሽን እቅድ 95% አፈጻጸም ላይ ይገኛል።</span>
                            </li>
                            <li className="flex gap-3 items-start animate-in slide-in-from-left-2" style={{animationDelay: '100ms'}}>
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span className="text-[10px] font-bold text-slate-700 leading-tight">የሳይበር ደህንነት ክትትል ሪፖርቶች በ2 ቀናት መዘግየት ታይቶባቸዋል።</span>
                            </li>
                            <li className="flex gap-3 items-start animate-in slide-in-from-left-2" style={{animationDelay: '200ms'}}>
                              <CheckCircle2 className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                              <span className="text-[10px] font-bold text-slate-700 leading-tight">የሃርድዌር ጥገና ድጋፍ ጥያቄዎች በ15% ጨምረዋል።</span>
                            </li>
                          </ul>
                        </div>
                        <Button className="w-full h-11 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all" onClick={() => {
                          toast({ title: "ዳውንሎድ", description: "ሪፖርቱ ወደ Word ፋይል በመቀየር ላይ ነው..." });
                        }}>
                          <Download className="w-4 h-4" /> ሙሉ ሪፖርቱን በ Word (DOCX) አውርድ
                        </Button>
                      </div>
                    </ScrollArea>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="social" className="h-full m-0 flex flex-col gap-3 outline-none overflow-hidden">
                <Card className="shadow-xl border-none rounded-[2rem] bg-white p-5 shrink-0 border-b-4 border-[#1e3a8a]">
                  <div className="flex gap-4">
                    <Avatar className="w-12 h-12 border-2 border-[#1e3a8a] shadow-md shrink-0">
                      <AvatarFallback className="bg-[#1e3a8a] text-white font-black text-sm">{user?.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <Textarea value={socialInput} onChange={(e) => setSocialInput(e.target.value)} placeholder="ዜና ወይም መልዕክት እዚህ ያጋሩ..." className="min-h-[70px] bg-slate-50 border-none rounded-xl text-[12px] font-medium resize-none" />
                      
                      {selectedSocialImage && (
                        <div className="relative w-32 h-32 rounded-xl overflow-hidden border shadow-lg group">
                          <img src={selectedSocialImage} className="w-full h-full object-cover" />
                          <button onClick={() => setSelectedSocialImage(null)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"><XCircle className="w-3 h-3" /></button>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <input type="file" ref={socialFileInputRef} className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = (ev) => setSelectedSocialImage(ev.target?.result as string);
                              r.readAsDataURL(file);
                            }
                          }} accept="image/*" />
                          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-slate-500 font-bold text-[10px] hover:bg-slate-100" onClick={() => socialFileInputRef.current?.click()}>
                            <ImageIcon className="w-3.5 h-3.5 mr-2" /> ፎቶ ጨምር
                          </Button>
                        </div>
                        <Button onClick={handlePostSocial} className="h-8 px-6 rounded-lg bg-[#1e3a8a] text-white font-black text-[9px] uppercase shadow-lg"><Send className="w-3 h-3 mr-2" /> ልጥፍ (Post)</Button>
                      </div>
                    </div>
                  </div>
                </Card>
                <ScrollArea className="flex-1">
                  <div className="space-y-4 pb-10">
                    {socialPosts.map(post => (
                      <Card key={post.id} className="shadow-lg border-none rounded-[2rem] bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                        <CardHeader className="p-4 flex flex-row items-center gap-3">
                          <Avatar className="w-9 h-9 border shadow-sm shrink-0">
                            <AvatarFallback className="bg-[#1e3a8a] text-white font-black text-[10px]">{post.authorName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[11px] font-black text-slate-900 truncate">{post.authorName}</h4>
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{post.authorPosition} • {new Date(post.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                          {(isAdmin || post.uploaderId === user?.uid) && (
                            <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db!, 'social_posts', post.id))} className="h-8 w-8 rounded-full text-slate-300 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </CardHeader>
                        <CardContent className="px-5 pb-5 pt-0 space-y-3">
                          {post.content && <p className="text-[11px] font-medium leading-relaxed text-slate-700">{post.content}</p>}
                          {post.imageUrl && (
                            <div className="rounded-2xl overflow-hidden border bg-slate-50 max-h-[400px] shadow-sm">
                              <img src={post.imageUrl} alt="Social content" className="w-full h-auto object-contain mx-auto" />
                            </div>
                          )}
                          <div className="flex items-center gap-6 pt-3 border-t border-slate-50">
                            <button className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors"><Heart className="w-4 h-4" /> {post.likes || 0}</button>
                            <button className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-blue-500 transition-colors"><MessageSquare className="w-4 h-4" /> {post.comments || 0}</button>
                            <button className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-green-500 transition-colors ml-auto"><Share2 className="w-4 h-4" /> አጋራ</button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      <footer className="px-6 h-8 bg-white border-t flex justify-between items-center shrink-0">
        <div className="flex gap-3 items-center text-[7px] font-black text-slate-400 uppercase tracking-widest">
          <span className="text-[#1e3a8a]">ITB Enterprise v6.0</span>
          <span className="text-slate-200">|</span>
          <span>Innovation Bureau - Zero Failure Sync</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[7px] font-black text-green-600 uppercase tracking-widest leading-none">ደህንነቱ የተጠበቀ (SSL)</span>
        </div>
      </footer>
    </div>
  );
}
