
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
  ChevronDown,
  LayoutTemplate,
  FileSearch,
  Zap,
  Eye,
  Users,
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
  Briefcase,
  Bell,
  CalendarDays
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { suggestSteps } from "@/ai/flows/suggest-steps-flow";
import { Badge } from "@/components/ui/badge";
import { 
  ResponsiveContainer, 
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip
} from 'recharts';
import { 
  useCollection, 
  useUser, 
  useFirestore, 
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking,
  useAuth
} from '@/firebase';
import { collection, query, doc, Timestamp, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [isSuggesting, setIsSuggesting] = useState(false);
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
          fileUrl: dataUri,
          type: 'application/xml',
          status: 'በሂደት ላይ',
          uploaderId: user.uid,
          expertName: user.displayName || "ባለሙያ",
          sector: "የቴክኖሎጂ ዘርፍ",
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

  const handleSocialImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setSelectedSocialImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePostSocial = async () => {
    if (!socialInput.trim() || !user || !db) return;
    const newPost: Omit<SocialPost, 'id'> = {
      authorName: user.displayName || "ባለሙያ",
      authorPosition: "ITB Staff",
      content: socialInput,
      imageUrl: selectedSocialImage || undefined,
      likes: 0,
      comments: 0,
      timestamp: new Date().toISOString(),
      uploaderId: user.uid
    };
    await addDocumentNonBlocking(collection(db, 'social_posts'), { ...newPost, createdAt: Timestamp.now() });
    setSocialInput("");
    setSelectedSocialImage(null);
    toast({ title: "ተለጠፈ", description: "መልዕክትዎ ለሰራተኞች ደርሷል" });
  };

  const handleSendFeedback = async () => {
    if (!feedbackInput.trim() || !user || !db) return;
    await addDocumentNonBlocking(collection(db, 'feedback'), {
      senderName: user.displayName || "ተጠቃሚ",
      content: feedbackInput,
      timestamp: new Date().toISOString(),
      uploaderId: user.uid,
      createdAt: Timestamp.now()
    });
    setFeedbackInput("");
    toast({ title: "ተልኳል", description: "መልዕክትዎ ተመዝግቧል" });
  };

  const handleDeleteSocialPost = async (id: string, uploaderId: string) => {
    if (!db) return;
    if (isAdmin || uploaderId === user?.uid) {
      await deleteDocumentNonBlocking(doc(db, 'social_posts', id));
      toast({ title: "ተሰርዟል", description: "መልዕክቱ ተወግዷል" });
    }
  };

  const handleDeleteChatMessage = async (id: string, uploaderId: string) => {
    if (!db) return;
    if (isAdmin || uploaderId === user?.uid) {
      await deleteDocumentNonBlocking(doc(db, 'feedback', id));
      toast({ title: "ተሰርዟል", description: "መልዕክቱ ተሰርዟል" });
    }
  };

  const handleDownload = (file: UploadedFile) => {
    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Tight Refined Header */}
      <header className="flex items-center justify-between px-6 py-1.5 bg-white border-b shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
            <span className="text-white font-black text-xs">ITB</span>
          </div>
          <div>
            <h1 className="text-sm font-black text-[#1e3a8a] tracking-tight">የኢኖቬሽንና ቴክኖሎጂ ቢሮ</h1>
            <p className="text-[7px] font-bold text-green-600 uppercase tracking-widest leading-none">Institutional Sync v5.5</p>
          </div>
        </div>
        
        <div className="flex-1 max-w-sm mx-6 relative hidden md:block">
          <Input value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="መዝገብ ቤት ፈልግ..." className="h-7 text-[10px] pl-9 rounded-full bg-slate-50 border-none" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-900 leading-none">{user.displayName || "ባለሙያ"}</span>
                <span className="text-[7px] font-bold text-slate-400 uppercase">{user.email === ADMIN_EMAIL ? 'የበላይ አስተዳዳሪ' : 'ባለሙያ'}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full p-0 h-9 w-9 border-2 border-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
                    <Avatar className="h-full w-full">
                      <AvatarFallback className="bg-[#1e3a8a] text-white text-[10px] font-black">{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-none">
                  <DropdownMenuLabel className="text-[10px] uppercase font-black px-4 text-slate-400 py-3 tracking-widest">አስተዳደር</DropdownMenuLabel>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center w-full p-3 rounded-xl font-bold text-xs hover:bg-slate-50">
                        <ShieldCheck className="w-4 h-4 mr-2 text-blue-600" /> የአስተዳዳሪ ገጽ
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setActiveTab("dashboard")} className="p-3 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer">
                    <History className="w-4 h-4 mr-2 text-slate-400" /> የቀን ውሎ መዝገብ
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-50" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 font-bold p-3 rounded-xl cursor-pointer hover:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2" /> ውጣ (Logout)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button asChild className="rounded-full bg-[#1e3a8a] font-black text-[10px] px-6 h-8 uppercase shadow-md"><Link href="/login">ይግቡ</Link></Button>
          )}
        </div>
      </header>

      <main className="flex-1 flex gap-3 p-3 overflow-hidden">
        {/* Left Side - Tools & Vault */}
        <div className="w-[340px] flex flex-col gap-3 overflow-hidden">
          <Card className="shadow-lg border-none rounded-[1.8rem] bg-white overflow-hidden shrink-0">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <BrainCircuit className="w-3.5 h-3.5 text-[#1e3a8a]" /> AI ካርታ ሰሪ
                </h2>
                <Button variant="ghost" size="sm" onClick={() => {setInput(""); setTitle("");}} className="h-7 w-7 text-red-500 rounded-lg p-0 hover:bg-red-50"><XCircle className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-2.5">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="የሂደት ስም..." className="h-8 rounded-xl bg-slate-50 border-none font-bold text-[10px]" />
                <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="ተግባራት እዚህ ይጻፉ..." className="min-h-[100px] rounded-xl bg-slate-50 border-none text-[10px] leading-relaxed font-medium resize-none" />
                <div className="flex gap-2">
                  <Button className="flex-1 h-8 bg-[#1e3a8a] rounded-xl font-black text-[9px] shadow-md uppercase" onClick={handleGenerate}>ካርታ አሳይ</Button>
                  <Button variant="outline" className="flex-1 h-8 border-slate-200 rounded-xl font-black text-[9px] uppercase" onClick={handleSaveToVault} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1.5" />} መዝግብ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 shadow-lg border-none rounded-[1.8rem] bg-white flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
              <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-slate-400" /> መዝገብ ቤት</h3>
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild><Button size="sm" className="h-7 rounded-lg bg-slate-900 text-[8px] font-black uppercase"><Upload className="w-3 h-3 mr-1" /> አዲስ መዝግብ</Button></DialogTrigger>
                <DialogContent className="max-w-md rounded-[2rem] p-6 border-none shadow-2xl">
                  <DialogHeader><DialogTitle className="font-black text-lg">አዲስ ፋይል መመዝገቢያ</DialogTitle></DialogHeader>
                  <div className="space-y-3.5 py-4">
                    <Input value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} placeholder="የፋይሉ አይነት (ለምሳሌ፡ ዲያግራም)" className="h-10 rounded-xl" />
                    <Input value={uploadSector} onChange={(e) => setUploadSector(e.target.value)} placeholder="የስራ ዘርፍ (Sector)" className="h-10 rounded-xl" />
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                      <Upload className="w-7 h-7 text-slate-300 mb-2" />
                      <span className="text-[10px] font-black text-slate-500 uppercase">{selectedFile ? selectedFile.name : "ፋይል ይምረጡ"}</span>
                      <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <Button className="w-full h-11 bg-[#1e3a8a] rounded-xl font-black uppercase shadow-lg" onClick={() => {}} disabled={isUploading || !selectedFile}>አጽድቅና መዝግብ</Button>
                </DialogContent>
              </Dialog>
            </div>
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {isDocsLoading ? (
                  <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-200" /></div>
                ) : filteredDocuments.map(file => (
                  <div key={file.id} className="group p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#1e3a8a]/10 group-hover:text-[#1e3a8a] transition-all"><FileText className="w-4 h-4" /></div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-900 leading-tight truncate">{file.name}</p>
                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{file.expertName} • {file.sector}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(file)} className="h-7 w-7 rounded-lg text-blue-600 hover:bg-blue-50"><Download className="w-3.5 h-3.5" /></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"><MoreVertical className="w-3.5 h-3.5 text-slate-400" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-2xl p-1.5 border-none">
                          <DropdownMenuItem onClick={() => handleDownload(file)} className="text-[10px] font-bold p-2.5 rounded-lg cursor-pointer"><Download className="w-3.5 h-3.5 mr-2 text-blue-600" /> አውርድ</DropdownMenuItem>
                          {(isAdmin || file.uploaderId === user?.uid) && (
                            <DropdownMenuItem onClick={() => {}} className="text-[10px] font-bold p-2.5 rounded-lg cursor-pointer text-red-600 bg-red-50"><Trash2 className="w-3.5 h-3.5 mr-2" /> ሰርዝ</DropdownMenuItem>
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

        {/* Right Side - Content Tabs */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex items-center justify-between bg-white border p-1 h-10 rounded-2xl shadow-sm shrink-0">
              <TabsList className="bg-transparent border-none gap-1">
                <TabsTrigger value="diagram" className="text-[9px] font-black px-5 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">ካርታ</TabsTrigger>
                <TabsTrigger value="social" className="text-[9px] font-black px-5 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">ማህበራዊ ገጽ</TabsTrigger>
                <TabsTrigger value="feedback" className="text-[9px] font-black px-5 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">የቢሮ ቻት</TabsTrigger>
                <TabsTrigger value="dashboard" className="text-[9px] font-black px-5 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">አፈጻጸም</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2 pr-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 rounded-xl font-black text-[8px] uppercase border-slate-200 hover:bg-slate-50">
                      <Download className="w-3 h-3 mr-1" /> ዳውንሎድ አዝማሚያ
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-xl p-1.5 w-44 shadow-2xl border-none">
                    <DropdownMenuItem onClick={() => viewerRef.current?.exportSVG()} className="text-[10px] font-bold p-2.5 cursor-pointer rounded-lg hover:bg-slate-50"><FileCode className="w-3.5 h-3.5 mr-2 text-orange-500" /> እንደ SVG አውርድ</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => viewerRef.current?.exportXML()} className="text-[10px] font-bold p-2.5 cursor-pointer rounded-lg hover:bg-slate-50"><FileJson className="w-3.5 h-3.5 mr-2 text-blue-500" /> እንደ BPMN አውርድ</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => viewerRef.current?.exportPNG()} className="text-[10px] font-bold p-2.5 cursor-pointer rounded-lg hover:bg-slate-50"><ImageIcon className="w-3.5 h-3.5 mr-2 text-green-500" /> እንደ ምስል (PNG)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex-1 mt-3 min-h-0 overflow-hidden">
              <TabsContent value="diagram" className="h-full m-0">
                <Card className="h-full rounded-[2rem] border-none shadow-xl overflow-hidden bg-white relative">
                  {xmlResult ? (
                    <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-10">
                      <LayoutTemplate className="w-20 h-20 text-slate-300" />
                      <p className="text-[10px] font-black uppercase tracking-widest mt-4">ዲያግራም አልተመረጠም</p>
                    </div>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="social" className="h-full m-0 flex flex-col gap-3 overflow-hidden">
                <Card className="shadow-lg border-none rounded-[1.8rem] bg-white p-4 shrink-0">
                  <div className="flex gap-3">
                    <Avatar className="w-11 h-11 border-2 border-[#1e3a8a] shadow-sm">
                      <AvatarFallback className="bg-[#1e3a8a] text-white font-black text-xs">{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea value={socialInput} onChange={(e) => setSocialInput(e.target.value)} placeholder="ዜና ወይም መልዕክት እዚህ ያጋሩ..." className="min-h-[80px] bg-slate-50 border-none rounded-2xl text-[11px] font-medium resize-none focus-visible:ring-1 focus-visible:ring-[#1e3a8a]/20" />
                      
                      {selectedSocialImage && (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border">
                          <img src={selectedSocialImage} className="w-full h-full object-cover" />
                          <button onClick={() => setSelectedSocialImage(null)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"><XCircle className="w-4 h-4" /></button>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <input type="file" ref={socialFileInputRef} className="hidden" onChange={handleSocialImageSelect} accept="image/*" />
                          <Button variant="ghost" size="sm" className="h-8 rounded-xl text-slate-500 font-bold text-[10px] hover:bg-slate-100" onClick={() => socialFileInputRef.current?.click()}>
                            <ImageIcon className="w-3.5 h-3.5 mr-1.5" /> ፎቶ ጨምር
                          </Button>
                        </div>
                        <Button onClick={handlePostSocial} className="h-8 px-6 rounded-xl bg-[#1e3a8a] text-white font-black text-[9px] uppercase shadow-md transition-transform active:scale-95"><Send className="w-3 h-3 mr-1.5" /> ልጠፍ (Post)</Button>
                      </div>
                    </div>
                  </div>
                </Card>
                <ScrollArea className="flex-1">
                  <div className="space-y-4 pb-4 px-1">
                    {socialPosts.map(post => (
                      <Card key={post.id} className="shadow-md border-none rounded-[1.8rem] bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-3">
                        <CardHeader className="p-4 flex flex-row items-center gap-3">
                          <Avatar className="w-10 h-10 border shadow-sm">
                            <AvatarFallback className="bg-[#1e3a8a] text-white font-black text-xs">{post.authorName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="text-[11px] font-black text-slate-900 leading-tight">{post.authorName}</h4>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">{post.authorPosition} • {new Date(post.timestamp).toLocaleTimeString()}</p>
                          </div>
                          {(isAdmin || post.uploaderId === user?.uid) && (
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSocialPost(post.id, post.uploaderId)} className="h-8 w-8 rounded-full text-slate-300 hover:text-red-600 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </CardHeader>
                        <CardContent className="px-5 pb-5 pt-0 space-y-3">
                          <p className="text-[11px] font-medium leading-relaxed text-slate-700">{post.content}</p>
                          {post.imageUrl && (
                            <div className="rounded-2xl overflow-hidden border bg-slate-50 max-h-[400px]">
                              <img src={post.imageUrl} alt="Social content" className="w-full h-auto object-contain mx-auto" />
                            </div>
                          )}
                          <div className="flex items-center gap-6 pt-3 border-t">
                            <button className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 hover:text-red-500 transition-colors"><Heart className="w-4 h-4" /> {post.likes || 0}</button>
                            <button className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 hover:text-blue-500 transition-colors"><MessageSquare className="w-4 h-4" /> {post.comments || 0}</button>
                            <button className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 hover:text-green-500 transition-colors ml-auto"><Share2 className="w-4 h-4" /> አጋራ</button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="feedback" className="h-full m-0 flex flex-col gap-3">
                <Card className="flex-1 shadow-xl border-none rounded-[2rem] bg-white flex flex-col overflow-hidden">
                  <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#1e3a8a] rounded-xl flex items-center justify-center text-white font-black text-[9px] shadow-md border-2 border-white">ITB</div>
                      <div>
                        <h3 className="text-[11px] font-black text-slate-900">ተቋማዊ መፃፃፊያ</h3>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-[7px] font-black text-green-600 uppercase tracking-widest">መስመር ላይ ያሉት ሰራተኞች</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ScrollArea className="flex-1 p-5">
                    <div className="space-y-4">
                      {feedbackMessages.map(msg => (
                        <div key={msg.id} className={`flex gap-3 group ${msg.uploaderId === user?.uid ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="w-8 h-8 border shadow-sm">
                            <AvatarFallback className={`${msg.uploaderId === user?.uid ? 'bg-slate-900' : 'bg-[#1e3a8a]'} text-white text-[9px] font-black`}>{msg.senderName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className={`max-w-[75%] ${msg.uploaderId === user?.uid ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black text-slate-400 uppercase">{msg.senderName}</span>
                              {(isAdmin || msg.uploaderId === user?.uid) && (
                                <button onClick={() => handleDeleteChatMessage(msg.id, msg.uploaderId)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <div className={`${msg.uploaderId === user?.uid ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'} p-3 rounded-2xl shadow-sm`}>
                              <p className="text-[10px] font-medium leading-relaxed">{msg.content}</p>
                            </div>
                            <span className="text-[7px] text-slate-300 font-bold mt-1">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-3 bg-white border-t flex gap-2 items-center">
                    <Input value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendFeedback()} placeholder="መልዕክት ይጻፉ..." className="h-9 bg-slate-50 border-none rounded-xl text-[10px] font-medium px-4 focus-visible:ring-1 focus-visible:ring-[#1e3a8a]/20" />
                    <Button className="h-9 w-9 p-0 rounded-xl bg-[#1e3a8a] text-white shadow-md active:scale-90 transition-transform" onClick={handleSendFeedback}><Send className="w-4 h-4" /></Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="dashboard" className="h-full m-0 overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-6">
                  <Card className="shadow-lg border-none rounded-[1.8rem] bg-white p-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2"><BarChart className="w-4 h-4 text-[#1e3a8a]" /> የቀን ውሎ አፈጻጸም</h3>
                    <div className="h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={uploadedFiles.slice(0, 7).reverse().map(f => ({ name: f.name.substring(0, 8), val: f.status === 'የጸደቀ' ? 100 : 70 }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="name" fontSize={8} fontWeight="bold" tickLine={false} axisLine={false} />
                          <YAxis fontSize={8} fontWeight="bold" tickLine={false} axisLine={false} />
                          <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px'}} />
                          <Line type="monotone" dataKey="val" stroke="#1e3a8a" strokeWidth={3} dot={{ fill: '#1e3a8a', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  
                  <Card className="shadow-lg border-none rounded-[1.8rem] bg-white p-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-600" /> AI ትንተና እና ሪፖርት</h3>
                    <div className="space-y-4">
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <h4 className="text-[9px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-amber-500" /> ትኩረት የሚሹ ጉዳዮች</h4>
                        <ul className="space-y-2.5 text-[10px] font-bold">
                          <li className="flex gap-2.5 items-start"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> የሂደት ማኑዋል ዝግጅት በ 15% መፋጠን አለበት</li>
                          <li className="flex gap-2.5 items-start"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> የባለሙያዎች የክህሎት ክፍተት ጥናት ተጠናቋል</li>
                          <li className="flex gap-2.5 items-start"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> የዲጂታል ትራንስፎርሜሽን እቅድ ጸድቋል</li>
                        </ul>
                      </div>
                      <Button className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] uppercase shadow-lg flex items-center justify-center gap-2"><Download className="w-4 h-4" /> ሙሉ ትንተናውን በ Word (DOCX) አውርድ</Button>
                    </div>
                  </Card>

                  <Card className="md:col-span-2 shadow-lg border-none rounded-[1.8rem] bg-white overflow-hidden">
                    <CardHeader className="bg-slate-50/50 py-4 px-6 border-b flex flex-row items-center justify-between">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><CalendarDays className="w-4 h-4 text-slate-400" /> የቀን ውሎ መዝገብ (Activity Log)</CardTitle>
                      <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-200">ዛሬ</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-50">
                        {uploadedFiles.slice(0, 5).map(log => (
                          <div key={log.id} className="flex items-center justify-between p-4 px-6 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="text-[10px] font-black text-slate-700">{log.expertName} {log.name} የተባለ ሰነድ መዝግቧል</span>
                            </div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(log.uploadDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      {/* Tight Footer Branding */}
      <footer className="px-6 py-1 bg-white border-t flex justify-between items-center shrink-0">
        <div className="flex gap-4 items-center text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <span className="text-[#1e3a8a]">ITB Worqu Enterprise v5.5</span>
          <span className="text-slate-200">|</span>
          <span>የኢኖቬሽንና ቴክኖሎጂ ቢሮ - የተረጋገጠ ሲስተም</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[7px] font-black text-green-600 uppercase tracking-widest leading-none">ደህንነቱ የተጠበቀ መስመር (SSL)</span>
        </div>
      </footer>
    </div>
  );
}
