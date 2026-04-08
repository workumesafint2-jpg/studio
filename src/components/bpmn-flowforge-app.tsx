
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Trash2, 
  Search,
  Loader2,
  Upload,
  FileText,
  BrainCircuit,
  LogOut,
  ShieldCheck,
  Save,
  Eye,
  MoreVertical,
  FileDown,
  Sparkles,
  Mail,
  TrendingUp,
  AlertTriangle,
  History,
  BarChart3,
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
  Languages,
  ChevronDown,
  MessageSquare,
  Send,
  User,
  Image as ImageIcon,
  FileCode,
  CheckCircle,
  Lightbulb,
  Landmark,
  Briefcase
} from "lucide-react";
import { generateBPMN } from "@/lib/bpmn-engine";
import { useToast } from "@/hooks/use-toast";
import { BPMNViewer, type BPMNViewerRef } from "@/components/bpmn-viewer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { collection, query, doc, Timestamp, orderBy, where } from 'firebase/firestore';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { processRegistry } from '@/ai/flows/registry-intelligence-flow';
import { translations, type Language } from '@/lib/translations';
import { ScrollArea } from "@/components/ui/scroll-area";

const ADMIN_EMAIL = "workumesafint2@gmail.com";

interface CommentRecord {
  id: string;
  docId: string;
  userId: string;
  userName: string;
  userRole: string;
  text: string;
  createdAt: any;
}

interface UploadedFile {
  id: string;
  name: string;
  category: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  fileUrl: string; 
  status: string;
  uploaderId: string;
  expertName?: string;
  sector?: string;
  institution?: string;
  registryNumber?: string;
  registryDate?: string;
  subject?: string;
  senderReceiver?: string;
  createdAt?: any;
}

const CATEGORIES = [
  { id: 'plan', label: '1. እቅድ' },
  { id: 'report', label: '2. ሪፖርት' },
  { id: 'incoming_letter', label: '3. ገቢ ደብዳቤ' },
  { id: 'outgoing_letter', label: '4. ወጪ ደብዳቤ' },
  { id: 'reform', label: '5. የሪፎርም ሰነዶች' },
  { id: 'service', label: '6. የቢሮ አገልግሎቶች' },
  { id: 'other', label: '7. ሌሎች' }
];

export function BPMNFlowForgeApp() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [xmlResult, setXmlResult] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("plan");
  const [registryLoading, setRegistryLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [currentLang, setCurrentLang] = useState<Language>('am');
  const [isDeleting, setIsDeleting] = useState<UploadedFile | null>(null);
  
  const [selectedDocForComments, setSelectedDocForComments] = useState<UploadedFile | null>(null);
  const [newComment, setNewComment] = useState("");

  const viewerRef = useRef<BPMNViewerRef>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  const t = translations[currentLang];

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang) setCurrentLang(savedLang);
  }, []);

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang);
    localStorage.setItem('app_lang', lang);
  };

  const isMasterAdmin = user?.email === ADMIN_EMAIL;
  const userDocQuery = useMemoFirebase(() => db && user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userProfile } = useDoc<any>(userDocQuery);

  const documentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: allDocs, isLoading: isDocsLoading } = useCollection<UploadedFile>(documentsQuery);

  const commentsQuery = useMemoFirebase(() => {
    if (!db || !selectedDocForComments) return null;
    return query(
      collection(db, 'comments'),
      where('docId', '==', selectedDocForComments.id),
      orderBy('createdAt', 'asc')
    );
  }, [db, selectedDocForComments]);

  const { data: comments } = useCollection<CommentRecord>(commentsQuery);

  const filteredDocuments = useMemo(() => {
    let list = allDocs || [];
    if (!isMasterAdmin && userProfile?.institution) {
      list = list.filter(f => f.institution === userProfile.institution || f.uploaderId === user?.uid);
    }
    if (!globalSearch.trim()) return list;
    const q = globalSearch.toLowerCase();
    return list.filter(f => 
      f.name?.toLowerCase().includes(q) || 
      f.expertName?.toLowerCase().includes(q) ||
      f.status?.toLowerCase().includes(q) ||
      f.registryNumber?.toLowerCase().includes(q) ||
      f.subject?.toLowerCase().includes(q) ||
      f.sector?.toLowerCase().includes(q)
    );
  }, [allDocs, globalSearch, isMasterAdmin, userProfile, user]);

  const performanceStats = useMemo(() => {
    if (!filteredDocuments.length) return { score: 0, plans: 0, reports: 0, focus: [] };
    const plans = filteredDocuments.filter(d => d.category.includes('እቅድ')).length;
    const reports = filteredDocuments.filter(d => d.category.includes('ሪፖርት')).length;
    const score = plans > 0 ? Math.min(Math.round((reports / plans) * 100), 100) : 0;
    
    const focus = [];
    if (score < 70) focus.push(currentLang === 'am' ? "የሪፖርት አቀራረብ መዘግየት በግልጽ ይታያል።" : "Report delays are visible.");
    
    return { score, plans, reports, focus };
  }, [filteredDocuments, currentLang]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const handleGenerate = () => {
    if (!input.trim()) {
      toast({ title: t.processDetails, description: "Please enter process details", variant: "destructive" });
      return;
    }
    const res = generateBPMN(input, title);
    if (res) {
      setXmlResult(res);
      toast({ title: "Success", description: "Diagram generated successfully" });
    }
  };

  const handleSaveToVault = async () => {
    if (!xmlResult || !db || !user) return;
    setIsSaving(true);
    try {
      const diagramName = title.trim() || "Process Diagram";
      const blob = new Blob([xmlResult], { type: 'application/xml' });
      const fileUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      addDocumentNonBlocking(collection(db, 'documents'), {
        name: diagramName,
        category: "ዲያግራም",
        fileName: `${diagramName}.bpmn`,
        fileSize: "BPMN XML",
        uploadDate: new Date().toISOString(),
        fileUrl: fileUrl,
        status: 'በሂደት ላይ',
        uploaderId: user.uid,
        sector: userProfile?.sector || "ያልታወቀ",
        institution: userProfile?.institution || "ያልታወቀ",
        expertName: user.displayName || user.email || "ባለሙያ",
        createdAt: Timestamp.now(),
        signatures: []
      });
      setIsSaving(false);
      toast({ title: "Success", description: "Saved to vault" });
    } catch (e) {
      setIsSaving(false);
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!db || !user) return;
    setRegistryLoading(true);
    try {
      const reader = new FileReader();
      const photoDataUri = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      let info = null;
      if (selectedCategory.includes('letter')) {
        try {
          const aiResult = await processRegistry({
            photoDataUri,
            category: selectedCategory as any,
            action: 'extract'
          });
          info = aiResult?.letterInfo;
        } catch (err) {
          console.error("AI Extraction failed", err);
        }
      }

      const categoryLabel = CATEGORIES.find(c => c.id === selectedCategory)?.label || selectedCategory;
      
      addDocumentNonBlocking(collection(db, 'documents'), {
        name: info?.subject || file.name,
        category: categoryLabel,
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        uploadDate: new Date().toISOString(),
        fileUrl: photoDataUri,
        status: 'በሂደት ላይ',
        uploaderId: user.uid,
        institution: userProfile?.institution || "ያልታወቀ",
        sector: userProfile?.sector || "ያልታወቀ",
        expertName: user.displayName || user.email || "ባለሙያ",
        registryNumber: info?.letterNumber || `REG/${Math.floor(1000 + Math.random() * 9000)}/2024`,
        registryDate: info?.letterDate || new Date().toLocaleDateString('et-ET'),
        subject: info?.subject || file.name,
        senderReceiver: info?.senderReceiver || "ያልታወቀ",
        createdAt: Timestamp.now(),
        signatures: []
      });

      toast({ title: "Success", description: "File registered" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to register", variant: "destructive" });
    } finally {
      setRegistryLoading(false);
      setIsUploadOpen(false);
    }
  };

  const handleApproveDoc = (docId: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'documents', docId), { status: 'የጸደቀ' });
    toast({ title: "የጸደቀ", description: "ሰነዱ በትክክል ጸድቋል" });
  };

  const handleDeleteConfirm = () => {
    if (!db || !isDeleting) return;
    deleteDocumentNonBlocking(doc(db, 'documents', isDeleting.id));
    setIsDeleting(null);
    toast({ title: "ተሰርዟል", description: "ሰነዱ ከመዝገብ ቤት ተሰርዟል" });
  };

  const handleDownloadDoc = (file: UploadedFile) => {
    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.fileName;
    link.click();
  };

  const handlePerformAIAnalysis = async () => {
    if (filteredDocuments.length === 0) {
      toast({ title: "Empty", description: "No data to analyze" });
      return;
    }
    setIsAnalyzing(true);
    try {
      const vaultSummary = filteredDocuments.map(d => `- Name: ${d.name}, Type: ${d.category}, Status: ${d.status}, Sector: ${d.sector}`).join('\n');
      const result = await processRegistry({
        action: 'analyze_performance',
        additionalContext: `Institutional Audit for ${userProfile?.institution || 'Organization'}:\n${vaultSummary}\nScore: ${performanceStats.score}%`
      });
      
      if (result && result.performanceAnalysis) {
        setAiAnalysisResult(result.performanceAnalysis);
        toast({ title: "Analysis Done", description: "Deep analysis complete" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Analysis failed", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredDocuments.length === 0) return;
    const headers = "Name,Category,Status,Expert,Sector,Institution,Number,Date\n";
    const rows = filteredDocuments.map(d => 
      `"${d.name}","${d.category}","${d.status}","${d.expertName}","${d.sector}","${d.institution}","${d.registryNumber || ''}","${d.uploadDate}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `registry_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const handleOpenFile = (file: UploadedFile) => {
    if (!file.fileUrl) return;
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${file.fileUrl}" frameborder="0" style="border:0; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !selectedDocForComments || !db || !user) return;
    try {
      addDocumentNonBlocking(collection(db, 'comments'), {
        docId: selectedDocForComments.id,
        userId: user.uid,
        userName: user.displayName || user.email || "ባለሙያ",
        userRole: userProfile?.role || "expert",
        text: newComment,
        createdAt: Timestamp.now()
      });
      setNewComment("");
    } catch (e) {
      toast({ title: "Error", description: "Failed to post comment", variant: "destructive" });
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="h-24 bg-white border-b flex items-center px-10 shrink-0 sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-[#1e3a8a] rounded-[1.5rem] flex items-center justify-center shadow-lg">
             <Landmark className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-[#1e3a8a] uppercase leading-none tracking-tight">
              {userProfile?.institution || t.title}
            </h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{userProfile?.sector} • Intelligence Hub</span>
          </div>
        </div>

        <div className="flex-1 flex justify-center px-12">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300" />
            <Input 
              value={globalSearch} 
              onChange={(e) => setGlobalSearch(e.target.value)} 
              placeholder={t.search} 
              className="w-full h-14 pl-14 pr-6 bg-slate-50 border-none rounded-[1.5rem] text-xs font-bold focus-visible:ring-4 focus-visible:ring-[#1e3a8a]/5 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 px-6 rounded-2xl flex items-center gap-3 text-slate-500 font-black text-[11px] uppercase border hover:bg-slate-50">
                <Languages className="w-5 h-5 text-[#1e3a8a]" />
                {currentLang === 'am' ? 'አማርኛ' : currentLang === 'en' ? 'English' : currentLang === 'or' ? 'Oromo' : 'ትግርኛ'}
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-[1.8rem] p-3 shadow-2xl border-none mt-2">
              <DropdownMenuItem onClick={() => changeLanguage('am')} className="text-xs font-bold p-4 rounded-xl cursor-pointer">አማርኛ</DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('en')} className="text-xs font-bold p-4 rounded-xl cursor-pointer">English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('or')} className="text-xs font-bold p-4 rounded-xl cursor-pointer">Afaan Oromoo</DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('ti')} className="text-xs font-bold p-4 rounded-xl cursor-pointer">ትግርኛ</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={handleExportCSV} className="h-12 w-12 rounded-2xl text-slate-400 hover:text-[#1e3a8a] bg-slate-50">
            <FileSpreadsheet className="w-6 h-6" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 w-12 p-0 rounded-full border-4 border-white shadow-xl overflow-hidden ring-1 ring-slate-100">
                <Avatar className="h-full w-full">
                  <AvatarFallback className="bg-[#1e3a8a] text-white text-[11px] font-black">
                    {user?.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-4 rounded-[2rem] border-none shadow-2xl bg-white mt-4">
              <div className="px-4 py-3 mb-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.expert}</p>
                 <p className="text-xs font-black text-[#1e3a8a] truncate">{user?.displayName}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center w-full p-4 rounded-xl font-bold text-[11px] cursor-pointer hover:bg-slate-50 transition-colors">
                  <ShieldCheck className="w-5 h-5 mr-3 text-blue-600" /> {t.admin}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 font-bold p-4 rounded-xl cursor-pointer hover:bg-red-50 text-[11px] transition-colors mt-1">
                <LogOut className="w-5 h-5 mr-3" /> {t.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 p-10 space-y-14 max-w-7xl mx-auto w-full">
        <section className="space-y-10">
          <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-2">{t.serviceName}</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="የአገልግሎቱ ወይም የሰነዱ ስም..." className="h-16 bg-slate-50 border-none rounded-[1.8rem] text-xs font-bold px-8 shadow-inner" />
              </div>
              <div className="space-y-5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-2">{t.processDetails}</label>
                <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="የሥራ ሂደቱን ዝርዝር እዚህ ይጥቀሱ..." className="min-h-[140px] bg-slate-50 border-none rounded-[1.8rem] text-xs font-medium p-8 resize-none shadow-inner" />
              </div>
            </div>
            <div className="flex items-center gap-6 mt-12">
              <Button onClick={handleGenerate} className="flex-1 h-18 bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 rounded-[1.8rem] text-[13px] font-black uppercase shadow-2xl tracking-widest gap-3 transition-all">
                <BrainCircuit className="w-6 h-6" /> {t.generate}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-18 px-12 rounded-[1.8rem] border-2 border-slate-50 bg-slate-50/30 font-black text-[11px] uppercase flex items-center gap-3 hover:bg-white shadow-xl">
                    <FileDown className="w-6 h-6" /> Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-[1.8rem] p-3 shadow-2xl border-none mt-2">
                  <DropdownMenuItem onClick={() => viewerRef.current?.exportPNG()} className="p-4 rounded-xl font-bold text-xs cursor-pointer hover:bg-blue-50">
                    <ImageIcon className="w-5 h-5 mr-3 text-blue-500" /> PNG ምስል
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => viewerRef.current?.exportSVG()} className="p-4 rounded-xl font-bold text-xs cursor-pointer hover:bg-purple-50">
                    <FileCode className="w-5 h-5 mr-3 text-purple-500" /> SVG ቬክተር
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => viewerRef.current?.exportXML()} className="p-4 rounded-xl font-bold text-xs cursor-pointer hover:bg-green-50">
                    <BrainCircuit className="w-5 h-5 mr-3 text-green-500" /> BPMN ፋይል
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleSaveToVault} disabled={!xmlResult || isSaving} variant="outline" className="h-18 px-12 rounded-[1.8rem] border-2 border-slate-50 bg-slate-50/30 font-black text-[11px] uppercase flex items-center gap-3 hover:bg-white shadow-xl">
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />} {t.save}
              </Button>
            </div>
          </Card>

          <Card className="min-h-[850px] rounded-[4rem] border-none shadow-2xl bg-white relative overflow-hidden group">
            {xmlResult ? (
              <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
                <BrainCircuit className="w-32 h-32 mb-8 text-[#1e3a8a]" />
                <p className="text-[18px] font-black uppercase tracking-[1em] text-[#1e3a8a]">{t.generate}</p>
              </div>
            )}
          </Card>
        </section>

        <section className="pt-24 space-y-12">
           <div className="h-px bg-slate-200 w-full mb-12" />
           <header className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#1e3a8a] uppercase tracking-tight">{t.intelligenceHub}</h2>
                <p className="text-[11px] text-slate-400 font-bold uppercase mt-2 tracking-[0.3em]">INSTITUTIONAL CORE ANALYSIS • {userProfile?.institution}</p>
              </div>
              <div className="flex items-center gap-5">
                <Button onClick={handlePerformAIAnalysis} disabled={isAnalyzing} className="h-14 px-10 rounded-[1.8rem] bg-purple-600 text-white shadow-2xl hover:bg-purple-700 font-black text-[11px] uppercase flex items-center gap-3 transition-all scale-105">
                  {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} {t.analyzeAI}
                </Button>
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-14 px-10 rounded-[1.8rem] bg-[#1e3a8a] text-white shadow-2xl hover:bg-[#1e3a8a]/90 font-black text-[11px] uppercase flex items-center gap-3">
                      <Upload className="w-5 h-5" /> {t.uploadFile}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg rounded-[3.5rem] p-12 border-none shadow-2xl bg-white">
                    <DialogHeader>
                      <DialogTitle className="text-center font-black uppercase text-[#1e3a8a] text-xl mb-8">{t.uploadFile}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.category}</label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="h-16 rounded-[1.8rem] bg-slate-50 border-none font-bold text-xs px-8 shadow-inner">
                            <SelectValue placeholder={t.category} />
                          </SelectTrigger>
                          <SelectContent className="rounded-[2rem] border-none shadow-2xl bg-white p-3 min-w-[200px] z-[1101]">
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat.id} value={cat.id} className="text-xs font-bold rounded-xl cursor-pointer p-4 hover:bg-slate-50 transition-colors">{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="border-4 border-dashed border-slate-100 rounded-[3rem] p-16 flex flex-col items-center justify-center gap-6 bg-slate-50/50 relative hover:bg-slate-50 hover:border-blue-100 transition-all group">
                        <Input type="file" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); }} className="absolute inset-0 opacity-0 cursor-pointer h-full" />
                        <FileText className="w-12 h-12 text-[#1e3a8a]/20 group-hover:scale-110 transition-transform" />
                        <p className="text-[11px] font-black text-slate-400 uppercase text-center tracking-widest">{t.uploadFile}</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
           </header>

           {aiAnalysisResult && (
             <div className="space-y-8">
               <Card className="rounded-[3.5rem] border-none shadow-2xl bg-gradient-to-br from-purple-50 via-white to-blue-50 p-12 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-5">
                    <Sparkles className="w-40 h-40 text-purple-600" />
                  </div>
                  <div className="flex flex-col lg:flex-row items-start gap-12 relative z-10">
                    <div className="w-28 h-28 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center shrink-0 border-4 border-purple-100">
                      <TrendingUp className="w-14 h-14 text-purple-600" />
                    </div>
                    <div className="space-y-10 flex-1 w-full">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                         <div>
                           <h3 className="text-2xl font-black text-purple-900 uppercase tracking-tight">{t.performanceReport}</h3>
                           <p className="text-[11px] font-bold text-purple-400 uppercase mt-2 tracking-widest">DEEP INTELLIGENCE ANALYTICS</p>
                         </div>
                         <Badge className="bg-purple-600 text-white font-black px-8 h-14 rounded-full text-lg shadow-2xl flex items-center gap-3">
                           <Sparkles className="w-6 h-6 animate-pulse" /> {performanceStats.score}% {t.efficiency}
                         </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="bg-white/70 p-8 rounded-[2.5rem] border border-white shadow-xl">
                            <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <FileText className="w-4 h-4" /> {t.essence}
                            </h4>
                            <p className="text-[15px] font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                              {aiAnalysisResult.narrative}
                            </p>
                         </div>
                         <div className="bg-white/70 p-8 rounded-[2.5rem] border border-white shadow-xl">
                            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4" /> {t.mainPoints}
                            </h4>
                            <ul className="space-y-4">
                              {aiAnalysisResult.essencePoints?.map((pt: string, i: number) => (
                                <li key={i} className="flex items-start gap-4 text-sm font-bold text-slate-700 bg-white/50 p-4 rounded-2xl border border-blue-50/50">
                                   <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-[10px] font-black">{i+1}</div>
                                   {pt}
                                </li>
                              ))}
                            </ul>
                         </div>
                      </div>

                      {aiAnalysisResult.focusAreas?.length > 0 && (
                        <div className="bg-red-50/50 p-8 rounded-[2.5rem] border border-red-100">
                           <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                             <AlertTriangle className="w-4 h-4" /> {t.focusAreas}
                           </h4>
                           <div className="flex flex-wrap gap-4">
                             {aiAnalysisResult.focusAreas.map((area: string, i: number) => (
                               <Badge key={i} variant="outline" className="bg-white border-red-100 text-red-600 font-black px-6 py-3 rounded-2xl text-[11px] uppercase">
                                 {area}
                               </Badge>
                             ))}
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
               </Card>
             </div>
           )}

           <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white overflow-hidden">
             <div className="p-12 border-b flex flex-col md:flex-row md:items-center justify-between gap-8 bg-slate-50/30">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-slate-100">
                    <History className="w-8 h-8 text-[#1e3a8a]" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">
                      {t.recentDocs}
                    </h3>
                    <p className="text-sm font-black text-slate-800">Secure Vault Registry • {userProfile?.institution}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <Badge variant="outline" className="rounded-full bg-blue-50 border-blue-100 text-[#1e3a8a] font-black text-[10px] px-8 h-12 uppercase tracking-widest flex items-center gap-3 shadow-sm">
                    <ShieldCheck className="w-5 h-5" /> 256-BIT ENCRYPTION
                  </Badge>
                </div>
             </div>
             <div className="divide-y divide-slate-50">
               {isDocsLoading ? (
                 <div className="p-48 flex flex-col items-center gap-6">
                   <Loader2 className="w-16 h-16 animate-spin text-slate-200" />
                   <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest animate-pulse">መረጃዎችን በማሰናዳት ላይ...</p>
                 </div>
               ) : (
                 filteredDocuments.map(docItem => (
                   <div key={docItem.id} className="p-10 hover:bg-slate-50 transition-all flex items-center justify-between group">
                     <div className="flex items-center gap-10">
                       <div className="w-20 h-20 bg-white border-4 rounded-3xl flex items-center justify-center shadow-xl border-white group-hover:border-blue-50 transition-all group-hover:scale-105">
                         {docItem.category.includes('ደብዳቤ') ? <Mail className="w-10 h-10 text-blue-400" /> : <FileText className="w-10 h-10 text-slate-300" />}
                       </div>
                       <div className="space-y-4">
                         <div className="flex items-center gap-6">
                           <span className="text-[17px] font-black text-slate-900 group-hover:text-[#1e3a8a] transition-colors">{docItem.name}</span>
                           <Badge variant="outline" className="text-[8px] font-black uppercase rounded-full h-7 px-5 bg-blue-50 border-blue-100 text-blue-600 shadow-sm">{docItem.category}</Badge>
                         </div>
                         <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3">
                               <Briefcase className="w-4 h-4 text-[#1e3a8a]/40" />
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{docItem.sector}</span>
                            </div>
                            <div className="flex items-center gap-3">
                               <Calendar className="w-4 h-4 text-slate-300" />
                               <span className="text-[10px] font-black text-slate-500 uppercase">{docItem.uploadDate.split('T')[0]}</span>
                            </div>
                            {docItem.registryNumber && (
                              <Badge className="text-[9px] font-black bg-slate-100 text-[#1e3a8a] border-none px-5 py-1.5 rounded-xl">{t.registryNo}: {docItem.registryNumber}</Badge>
                            )}
                         </div>
                       </div>
                     </div>
                     <div className="flex items-center gap-6">
                       <Badge className="h-12 px-8 rounded-full text-[10px] font-black uppercase border-none shadow-xl bg-blue-50 text-blue-600">
                         {docItem.status}
                       </Badge>
                       <div className="flex items-center gap-3">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenFile(docItem)} className="h-14 w-14 rounded-[1.5rem] text-[#1e3a8a] bg-slate-50 group-hover:bg-blue-100 transition-all shadow-sm">
                            <Eye className="w-6 h-6" />
                          </Button>
                          <Dialog open={selectedDocForComments?.id === docItem.id} onOpenChange={(open) => setSelectedDocForComments(open ? docItem : null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-14 w-14 rounded-[1.5rem] text-purple-600 bg-slate-50 group-hover:bg-purple-100 transition-all shadow-sm">
                                <MessageSquare className="w-6 h-6" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl rounded-[3.5rem] p-0 border-none shadow-2xl bg-white overflow-hidden flex flex-col max-h-[90vh]">
                              <DialogHeader className="p-10 border-b bg-slate-50/80">
                                <DialogTitle className="flex items-center gap-5">
                                  <div className="w-12 h-12 bg-[#1e3a8a]/10 rounded-2xl flex items-center justify-center">
                                    <MessageSquare className="w-7 h-7 text-[#1e3a8a]" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-lg font-black text-slate-900">{t.comments}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{docItem.name}</span>
                                  </div>
                                </DialogTitle>
                              </DialogHeader>
                              
                              <ScrollArea className="flex-1 p-10">
                                <div className="space-y-8">
                                  {comments && comments.length > 0 ? (
                                    comments.map((comment) => (
                                      <div key={comment.id} className={`flex flex-col ${comment.userId === user?.uid ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[85%] rounded-[2rem] p-8 shadow-2xl ${comment.userId === user?.uid ? 'bg-[#1e3a8a] text-white rounded-tr-none' : 'bg-slate-50 text-slate-900 rounded-tl-none border border-slate-100'}`}>
                                          <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">
                                              {comment.userName.charAt(0)}
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${comment.userId === user?.uid ? 'text-blue-200' : 'text-slate-400'}`}>
                                              {comment.userName} • {comment.userRole}
                                            </span>
                                          </div>
                                          <p className="text-[15px] font-bold leading-relaxed">{comment.text}</p>
                                          <p className={`text-[9px] font-bold mt-4 opacity-50`}>
                                            {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleString('et-ET') : '...'}
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-32 opacity-10">
                                      <MessageSquare className="w-24 h-24 mb-6" />
                                      <p className="text-[12px] font-black uppercase tracking-[0.5em]">{t.noComments}</p>
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>

                              <DialogFooter className="p-10 border-t bg-slate-50/50">
                                <div className="flex items-center gap-5 w-full">
                                  <Input 
                                    value={newComment} 
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={t.writeComment} 
                                    className="h-16 bg-white border-none rounded-[1.8rem] text-sm font-bold px-8 shadow-2xl flex-1"
                                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                                  />
                                  <Button onClick={handlePostComment} className="h-16 w-16 rounded-[1.8rem] bg-[#1e3a8a] text-white shadow-2xl hover:bg-[#1e3a8a]/90 flex items-center justify-center">
                                    <Send className="w-6 h-6" />
                                  </Button>
                                </div>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-14 w-14 rounded-[1.5rem] text-slate-400 bg-slate-50 hover:bg-white shadow-sm transition-all">
                                <MoreVertical className="w-6 h-6" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 rounded-[2rem] p-3 shadow-2xl border-none mt-2">
                              <DropdownMenuItem onClick={() => handleDownloadDoc(docItem)} className="p-4 rounded-xl font-bold text-xs cursor-pointer hover:bg-blue-50">
                                <Download className="w-5 h-5 mr-3 text-blue-500" /> አውርድ
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleApproveDoc(docItem.id)} className="p-4 rounded-xl font-bold text-xs cursor-pointer text-green-600 hover:bg-green-50">
                                <CheckCircle className="w-5 h-5 mr-3" /> ያጽድቁ
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                disabled={!isMasterAdmin && user?.uid !== docItem.uploaderId}
                                onClick={() => setIsDeleting(docItem)} 
                                className="p-4 rounded-xl font-bold text-xs cursor-pointer text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-5 h-5 mr-3" /> ሰርዝ
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                       </div>
                     </div>
                   </div>
                 ))
               )}
             </div>
           </Card>
        </section>
      </main>

      <AlertDialog open={!!isDeleting} onOpenChange={(open) => !open && setIsDeleting(null)}>
        <AlertDialogContent className="rounded-[3.5rem] p-12 border-none shadow-2xl bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-red-600 uppercase flex items-center gap-4">
              <AlertTriangle className="w-8 h-8" /> ሰነድ ሰርዝ
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base font-bold text-slate-500 mt-6 leading-relaxed">
              ይህ ሰነድ ከመዝገብ ቤት ለዘላለም ሊጠፋ ነው። እባክዎ ድርጊቱን ከመፈጸምዎ በፊት እርግጠኛ ይሁኑ። ሰነዱ አንዴ ከተሰረዘ መልሶ ማግኘት አይቻልም።
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-12 gap-5">
            <AlertDialogCancel className="h-16 px-10 rounded-[1.8rem] font-black text-[12px] uppercase border-none bg-slate-100 hover:bg-slate-200">ተመለስ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="h-16 px-10 rounded-[1.8rem] font-black text-[12px] uppercase bg-red-600 text-white hover:bg-red-700 shadow-2xl">አረጋግጥ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button onClick={() => router.push('/admin')} className="fixed bottom-14 right-14 h-24 w-24 rounded-full bg-[#1e3a8a] shadow-[0_20px_60px_rgba(30,58,138,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 p-0 ring-8 ring-white/20">
        <ShieldCheck className="w-10 h-10 text-white" />
      </Button>
    </div>
  );
}
