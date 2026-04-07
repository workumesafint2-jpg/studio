
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
  User
} from "lucide-react";
import { generateBPMN } from "@/lib/bpmn-engine";
import { useToast } from "@/hooks/use-toast";
import { BPMNViewer, type BPMNViewerRef } from "@/components/bpmn-viewer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  SelectGroup,
  SelectLabel
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  useCollection, 
  useUser, 
  useFirestore, 
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useAuth,
  useDoc
} from '@/firebase';
import { collection, query, doc, Timestamp, orderBy, where } from 'firebase/firestore';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { processRegistry } from '@/ai/flows/registry-intelligence-flow';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
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
    if (!isMasterAdmin && userProfile?.sector && userProfile.sector !== 'pending') {
      list = list.filter(f => f.sector === userProfile.sector || f.uploaderId === user?.uid);
    }
    if (!globalSearch.trim()) return list;
    const q = globalSearch.toLowerCase();
    return list.filter(f => 
      f.name?.toLowerCase().includes(q) || 
      f.expertName?.toLowerCase().includes(q) ||
      f.status?.toLowerCase().includes(q) ||
      f.registryNumber?.toLowerCase().includes(q) ||
      f.subject?.toLowerCase().includes(q)
    );
  }, [allDocs, globalSearch, isMasterAdmin, userProfile, user]);

  const performanceStats = useMemo(() => {
    if (!filteredDocuments.length) return { score: 0, plans: 0, reports: 0, focus: [] };
    const plans = filteredDocuments.filter(d => d.category.includes('እቅድ')).length;
    const reports = filteredDocuments.filter(d => d.category.includes('ሪፖርት')).length;
    const score = plans > 0 ? Math.min(Math.round((reports / plans) * 100), 100) : 0;
    
    const focus = [];
    if (score < 70) focus.push(currentLang === 'am' ? "የሪፖርት አቀራረብ መዘግየት በግልጽ ይታያል።" : "Report delays are visible.");
    if (plans > reports) focus.push(currentLang === 'am' ? `${plans - reports} እቅዶች እስካሁን ሪፖርት አልቀረበባቸውም።` : `${plans - reports} plans pending reports.`);
    
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
        sector: userProfile?.sector || "ያልታወቀ",
        expertName: user.displayName || user.email || "ባለሙያ",
        registryNumber: info?.letterNumber || `ITB/${Math.floor(1000 + Math.random() * 9000)}/2024`,
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

  const handlePerformAIAnalysis = async () => {
    if (filteredDocuments.length === 0) {
      toast({ title: "Empty", description: "No data to analyze" });
      return;
    }
    setIsAnalyzing(true);
    try {
      const vaultSummary = filteredDocuments.map(d => `- ${d.name} (Category: ${d.category}, Status: ${d.status})`).join('\n');
      const result = await processRegistry({
        action: 'analyze_performance',
        additionalContext: `Institutional Audit:\n${vaultSummary}\nScore: ${performanceStats.score}%`
      });
      
      if (result && result.performanceAnalysis) {
        setAiAnalysisResult(result.performanceAnalysis);
        toast({ title: "Analysis Done", description: "Bureau performance analyzed" });
      } else {
        throw new Error("No output");
      }
    } catch (e) {
      setAiAnalysisResult({
        score: performanceStats.score,
        narrative: currentLang === 'am' ? `በመዝገብ ቤት ውስጥ ባለው ዳታ መሰረት የቢሮው አፈጻጸም ${performanceStats.score}% ነው።` : `Bureau efficiency is ${performanceStats.score}% based on records.`,
        focusAreas: performanceStats.focus
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredDocuments.length === 0) return;
    const headers = "Name,Category,Status,Expert,Sector,Number,Date\n";
    const rows = filteredDocuments.map(d => 
      `"${d.name}","${d.category}","${d.status}","${d.expertName}","${d.sector}","${d.registryNumber || ''}","${d.uploadDate}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `itb_registry_${new Date().toISOString().slice(0,10)}.csv`;
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
      <header className="h-20 bg-white border-b flex items-center px-8 shrink-0 sticky top-0 z-[100] shadow-sm">
        <div className="flex flex-col">
          <h1 className="text-sm font-black text-[#1e3a8a] uppercase leading-none tracking-tight">{t.title}</h1>
          <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">{t.subtitle} V7.0.0</span>
        </div>

        <div className="flex-1 flex justify-center px-12">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <Input 
              value={globalSearch} 
              onChange={(e) => setGlobalSearch(e.target.value)} 
              placeholder={t.search} 
              className="w-full h-12 pl-12 pr-4 bg-slate-50 border-none rounded-full text-xs font-bold focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/10"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 px-4 rounded-xl flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase">
                <Languages className="w-4 h-4" />
                {currentLang === 'am' ? 'አማርኛ' : currentLang === 'en' ? 'English' : currentLang === 'or' ? 'Oromo' : 'Tigrinya'}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-2xl p-2 shadow-2xl border-none">
              <DropdownMenuItem onClick={() => changeLanguage('am')} className="text-xs font-bold p-3 rounded-xl cursor-pointer">አማርኛ (Amharic)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('en')} className="text-xs font-bold p-3 rounded-xl cursor-pointer">English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('or')} className="text-xs font-bold p-3 rounded-xl cursor-pointer">Afaan Oromoo</DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('ti')} className="text-xs font-bold p-3 rounded-xl cursor-pointer">ትግርኛ (Tigrinya)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={handleExportCSV} className="h-10 w-10 text-slate-400 hover:text-[#1e3a8a]">
            <FileSpreadsheet className="w-5 h-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 p-0 rounded-full border shadow-sm overflow-hidden">
                <Avatar className="h-full w-full">
                  <AvatarFallback className="bg-[#1e3a8a] text-white text-[10px] font-black">
                    {user?.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-3 rounded-[1.5rem] border-none shadow-2xl bg-white mt-2">
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center w-full p-4 rounded-xl font-bold text-[11px] cursor-pointer hover:bg-slate-50 transition-colors">
                  <ShieldCheck className="w-4 h-4 mr-3 text-blue-600" /> {t.admin}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 font-bold p-4 rounded-xl cursor-pointer hover:bg-red-50 text-[11px] transition-colors mt-1">
                <LogOut className="w-4 h-4 mr-3" /> {t.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 p-8 space-y-12 max-w-7xl mx-auto w-full">
        <section className="space-y-8">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.serviceName}</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-14 bg-slate-50 border-none rounded-2xl text-xs font-bold px-6" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.processDetails}</label>
                <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[120px] bg-slate-50 border-none rounded-2xl text-xs font-medium p-6 resize-none" />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-10">
              <Button onClick={handleGenerate} className="flex-1 h-16 bg-[#4c1d95] hover:bg-[#4c1d95]/90 rounded-2xl text-[12px] font-black uppercase shadow-2xl tracking-widest">{t.generate}</Button>
              <Button onClick={handleSaveToVault} disabled={!xmlResult || isSaving} variant="outline" className="h-16 px-10 rounded-2xl border-2 border-slate-100 font-black text-[11px] uppercase flex items-center gap-3">
                <Save className="w-5 h-5" /> {t.save}
              </Button>
            </div>
          </Card>

          <Card className="min-h-[850px] rounded-[3.5rem] border-none shadow-2xl bg-white relative overflow-hidden">
            {xmlResult ? (
              <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none">
                <BrainCircuit className="w-24 h-24 mb-6 text-[#1e3a8a]" />
                <p className="text-[14px] font-black uppercase tracking-[0.5em] text-[#1e3a8a]">{t.generate}</p>
              </div>
            )}
          </Card>
        </section>

        <section className="pt-20 space-y-10">
           <div className="h-px bg-slate-200 w-full mb-10" />
           <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#1e3a8a] uppercase tracking-tight">{t.intelligenceHub}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">INTELLIGENCE HUB • {t.efficiency}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={handlePerformAIAnalysis} disabled={isAnalyzing} className="h-12 px-6 rounded-2xl bg-purple-600 text-white shadow-xl hover:bg-purple-700 font-black text-[10px] uppercase flex items-center gap-2 transition-all">
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {t.analyzeAI}
                </Button>
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-12 px-8 rounded-2xl bg-[#1e3a8a] text-white shadow-xl hover:bg-[#1e3a8a]/90 font-black text-[10px] uppercase flex items-center gap-2">
                      <Upload className="w-4 h-4" /> {t.uploadFile}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-[2.5rem] p-10 border-none shadow-2xl bg-white">
                    <DialogHeader>
                      <DialogTitle className="text-center font-black uppercase text-[#1e3a8a] mb-6">{t.uploadFile}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.category}</label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-xs px-6 shadow-sm">
                            <SelectValue placeholder={t.category} />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-2xl bg-white p-2 min-w-[200px] z-[1101]">
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat.id} value={cat.id} className="text-xs font-bold rounded-xl cursor-pointer p-3">{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="border-2 border-dashed border-slate-100 rounded-3xl p-12 flex flex-col items-center justify-center gap-5 bg-slate-50/50 relative hover:bg-slate-50 transition-colors">
                        <Input type="file" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); }} className="absolute inset-0 opacity-0 cursor-pointer h-full" />
                        <FileText className="w-8 h-8 text-[#1e3a8a]/40" />
                        <p className="text-[10px] font-black text-slate-400 uppercase text-center tracking-widest">{t.uploadFile}</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
           </header>

           {(aiAnalysisResult || performanceStats.score > 0) && (
             <Card className="rounded-[2.5rem] border-none shadow-2xl bg-gradient-to-br from-purple-50 to-blue-50/30 p-10">
                <div className="flex flex-col lg:flex-row items-start gap-10">
                  <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center shrink-0 border border-purple-100">
                    <BarChart3 className="w-12 h-12 text-purple-600" />
                  </div>
                  <div className="space-y-6 flex-1 w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                       <div>
                         <h3 className="text-xl font-black text-purple-900 uppercase tracking-tight">{t.performanceReport}</h3>
                         <p className="text-[10px] font-bold text-purple-400 uppercase mt-1">Institutional Intelligence Feed</p>
                       </div>
                       <Badge className="bg-purple-600 text-white font-black px-6 h-10 rounded-full text-sm shadow-xl flex items-center gap-2">
                         <TrendingUp className="w-4 h-4" /> {performanceStats.score}% {t.efficiency}
                       </Badge>
                    </div>
                    <div className="bg-white/60 p-6 rounded-3xl border border-white shadow-sm">
                      <p className="text-sm font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {aiAnalysisResult?.narrative || `Bureau efficiency is ${performanceStats.score}% based on records.`}
                      </p>
                    </div>
                  </div>
                </div>
             </Card>
           )}

           <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
             <div className="p-10 border-b flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-1">
                    <History className="w-4 h-4" /> {t.recentDocs}
                  </h3>
                  <p className="text-xs font-black text-slate-800">Secure Institutional Repository</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="rounded-full bg-blue-50 border-blue-100 text-[#1e3a8a] font-black text-[9px] px-6 h-10 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> SECURE DATA VAULT
                  </Badge>
                </div>
             </div>
             <div className="divide-y divide-slate-50">
               {isDocsLoading ? (
                 <div className="p-40 flex flex-col items-center gap-4">
                   <Loader2 className="w-12 h-12 animate-spin text-slate-200" />
                 </div>
               ) : (
                 filteredDocuments.map(docItem => (
                   <div key={docItem.id} className="p-8 hover:bg-slate-50 transition-all flex items-center justify-between group">
                     <div className="flex items-center gap-8">
                       <div className="w-16 h-16 bg-white border-2 rounded-2xl flex items-center justify-center shadow-sm border-slate-50 group-hover:border-blue-100 transition-colors">
                         {docItem.category.includes('ደብዳቤ') ? <Mail className="w-8 h-8 text-blue-400" /> : <FileText className="w-8 h-8 text-slate-300" />}
                       </div>
                       <div className="space-y-2">
                         <div className="flex items-center gap-4">
                           <span className="text-[14px] font-black text-slate-900 group-hover:text-[#1e3a8a] transition-colors">{docItem.name}</span>
                           <Badge variant="outline" className="text-[7px] font-black uppercase rounded-full h-5 px-3 bg-blue-50 border-blue-100 text-blue-600 shadow-sm">{docItem.category}</Badge>
                         </div>
                         <div className="flex items-center gap-5">
                            <div className="flex items-center gap-2">
                               <Building2 className="w-3 h-3 text-slate-300" />
                               <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{docItem.sector}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <Calendar className="w-3 h-3 text-slate-300" />
                               <span className="text-[9px] font-black text-slate-500 uppercase">{docItem.uploadDate.split('T')[0]}</span>
                            </div>
                            {docItem.registryNumber && (
                              <Badge className="text-[8px] font-black bg-slate-100 text-[#1e3a8a] border-none px-3">{t.registryNo}: {docItem.registryNumber}</Badge>
                            )}
                         </div>
                       </div>
                     </div>
                     <div className="flex items-center gap-4">
                       <Badge className="h-10 px-6 rounded-full text-[9px] font-black uppercase border-none shadow-sm bg-blue-50 text-blue-600">
                         {docItem.status}
                       </Badge>
                       <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenFile(docItem)} className="h-12 w-12 rounded-2xl text-[#1e3a8a] bg-slate-50 group-hover:bg-blue-50">
                            <Eye className="w-5 h-5" />
                          </Button>
                          <Dialog open={selectedDocForComments?.id === docItem.id} onOpenChange={(open) => setSelectedDocForComments(open ? docItem : null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-purple-600 bg-slate-50 group-hover:bg-purple-50">
                                <MessageSquare className="w-5 h-5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 border-none shadow-2xl bg-white overflow-hidden flex flex-col max-h-[85vh]">
                              <DialogHeader className="p-8 border-b bg-slate-50/50">
                                <DialogTitle className="flex items-center gap-3">
                                  <MessageSquare className="w-6 h-6 text-[#1e3a8a]" />
                                  <div className="flex flex-col">
                                    <span className="text-[14px] font-black text-slate-900">{t.comments}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{docItem.name}</span>
                                  </div>
                                </DialogTitle>
                              </DialogHeader>
                              
                              <ScrollArea className="flex-1 p-8">
                                <div className="space-y-6">
                                  {comments && comments.length > 0 ? (
                                    comments.map((comment) => (
                                      <div key={comment.id} className={`flex flex-col ${comment.userId === user?.uid ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[85%] rounded-[1.5rem] p-5 shadow-sm ${comment.userId === user?.uid ? 'bg-[#1e3a8a] text-white rounded-tr-none' : 'bg-slate-100 text-slate-900 rounded-tl-none'}`}>
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[9px] font-black uppercase ${comment.userId === user?.uid ? 'text-blue-200' : 'text-slate-400'}`}>
                                              {comment.userName} • {comment.userRole}
                                            </span>
                                          </div>
                                          <p className="text-xs font-medium leading-relaxed">{comment.text}</p>
                                          <p className={`text-[8px] font-bold mt-2 ${comment.userId === user?.uid ? 'text-blue-300' : 'text-slate-400'}`}>
                                            {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleString('et-ET') : '...'}
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                      <MessageSquare className="w-16 h-16 mb-4" />
                                      <p className="text-[10px] font-black uppercase tracking-widest">{t.noComments}</p>
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>

                              <DialogFooter className="p-8 border-t bg-slate-50/50">
                                <div className="flex items-center gap-4 w-full">
                                  <Input 
                                    value={newComment} 
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={t.writeComment} 
                                    className="h-14 bg-white border-none rounded-2xl text-xs font-bold px-6 shadow-sm flex-1"
                                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                                  />
                                  <Button onClick={handlePostComment} className="h-14 w-14 rounded-2xl bg-[#1e3a8a] text-white shadow-xl hover:bg-[#1e3a8a]/90">
                                    <Send className="w-5 h-5" />
                                  </Button>
                                </div>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                       </div>
                     </div>
                   </div>
                 ))
               )}
             </div>
           </Card>
        </section>
      </main>

      <Button onClick={() => router.push('/admin')} className="fixed bottom-12 right-12 h-18 w-18 rounded-full bg-[#1e3a8a] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 p-0">
        <ShieldCheck className="w-8 h-8 text-white" />
      </Button>
    </div>
  );
}
