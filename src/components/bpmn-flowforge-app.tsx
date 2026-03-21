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
  MessageSquare,
  Send,
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
  Download,
  FileSpreadsheet
} from "lucide-react";
import { generateBPMN } from "@/lib/bpmn-engine";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { collection, query, doc, Timestamp, orderBy } from 'firebase/firestore';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { processRegistry } from '@/ai/flows/registry-intelligence-flow';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const ADMIN_EMAIL = "workumesafint2@gmail.com";

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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

  const viewerRef = useRef<BPMNViewerRef>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isMasterAdmin = user?.email === ADMIN_EMAIL;
  const userDocQuery = useMemoFirebase(() => db && user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userProfile } = useDoc<any>(userDocQuery);

  const documentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: allDocs, isLoading: isDocsLoading } = useCollection<UploadedFile>(documentsQuery);
  
  const filteredDocuments = useMemo(() => {
    let list = allDocs || [];
    if (!isMasterAdmin && userProfile?.sector) {
      list = list.filter(f => f.sector === userProfile.sector || f.uploaderId === user?.uid);
    }
    if (!globalSearch.trim()) return list;
    const q = globalSearch.toLowerCase();
    return list.filter(f => 
      f.name?.toLowerCase().includes(q) || 
      f.expertName?.toLowerCase().includes(q) ||
      f.status?.toLowerCase().includes(q) ||
      f.registryNumber?.toLowerCase().includes(q)
    );
  }, [allDocs, globalSearch, isMasterAdmin, userProfile, user]);

  const performanceData = useMemo(() => [
    { name: 'ሰኞ', value: 72 },
    { name: 'ማክሰኞ', value: 85 },
    { name: 'ረቡዕ', value: 64 },
    { name: 'ሐሙስ', value: 91 },
    { name: 'አርብ', value: 78 },
  ], []);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const handleGenerate = () => {
    if (!input.trim()) {
      toast({ title: "መረጃ ይጎድላል", description: "እባክዎ የሂደት ዝርዝር ያስገቡ", variant: "destructive" });
      return;
    }
    const res = generateBPMN(input, title);
    if (res) {
      setXmlResult(res);
      toast({ title: "ተሳክቷል", description: "የሥራ ሂደት ካርታው ተዘጋጅቷል" });
    }
  };

  const handleSaveToVault = async () => {
    if (!xmlResult || !db || !user) return;
    setIsSaving(true);
    try {
      const diagramName = title.trim() || "የሥራ ሂደት ካርታ";
      const blob = new Blob([xmlResult], { type: 'application/xml' });
      const fileUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      await addDocumentNonBlocking(collection(db, 'documents'), {
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
      toast({ title: "ተሳክቷል", description: "ዲያግራሙ በመዝገብ ቤት ተቀምጧል" });
    } catch (e) {
      setIsSaving(false);
      toast({ title: "ስህተት", description: "ዲያግራሙን ማስቀመጥ አልተቻለም", variant: "destructive" });
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

      let aiResult = null;
      if (selectedCategory.includes('letter')) {
        aiResult = await processRegistry({
          photoDataUri,
          category: selectedCategory as any,
          action: 'extract'
        });
      }

      const info = aiResult?.letterInfo;
      const categoryLabel = CATEGORIES.find(c => c.id === selectedCategory)?.label || selectedCategory;
      
      await addDocumentNonBlocking(collection(db, 'documents'), {
        name: info?.subject || file.name,
        category: categoryLabel,
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        uploadDate: new Date().toISOString(),
        fileUrl: photoDataUri,
        status: 'በሂደት ላይ',
        uploaderId: user.uid,
        sector: userProfile?.sector || "N/A",
        expertName: user.displayName || user.email || "ባለሙያ",
        registryNumber: info?.letterNumber || `ITB/${Math.floor(1000 + Math.random() * 9000)}/2024`,
        registryDate: info?.letterDate || new Date().toLocaleDateString('et-ET'),
        subject: info?.subject || file.name,
        senderReceiver: info?.senderReceiver || "ያልታወቀ",
        createdAt: Timestamp.now(),
        signatures: []
      });

      toast({ title: "ተሳክቷል", description: "ፋይሉ በተሳካ ሁኔታ ተመዝግቧል" });
    } catch (e) {
      toast({ title: "ስህተት", description: "ፋይሉን መመዝገብ አልተቻለም", variant: "destructive" });
    } finally {
      setRegistryLoading(false);
      setIsUploadOpen(false);
    }
  };

  const handlePerformAIAnalysis = async () => {
    if (filteredDocuments.length === 0) {
      toast({ title: "መረጃ የለም", description: "ለመተንተን በመዝገብ ቤቱ ውስጥ ፋይሎች ያስፈልጋሉ" });
      return;
    }
    setIsAnalyzing(true);
    try {
      const vaultSummary = filteredDocuments.map(d => `- ${d.name} (ምድብ፦ ${d.category}, ሁኔታ፦ ${d.status}, ባለሙያ፦ ${d.expertName})`).join('\n');
      const result = await processRegistry({
        action: 'analyze_performance',
        additionalContext: `የመዝገብ ቤት ወቅታዊ ሁኔታ፦\n${vaultSummary}`
      });
      
      if (result && result.performanceAnalysis) {
        setAiAnalysisResult(result.performanceAnalysis);
        toast({ title: "ትንተና ተጠናቋል", description: "የቢሮው አፈጻጸም በ AI ተጠንቷል" });
      } else {
        throw new Error("No output from AI");
      }
    } catch (e) {
      toast({ title: "ስህተት", description: "AI ትንተናውን መስራት አልቻለም። እባክዎ እንደገና ይሞክሩ።", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredDocuments.length === 0) {
      toast({ title: "መረጃ የለም", description: "ወደ CSV ለመቀየር በመዝገቡ ውስጥ ዳታ ያስፈልጋል" });
      return;
    }
    const headers = "ስም,ምድብ,ሁኔታ,ባለሙያ,ዘርፍ,ቁጥር,ቀን\n";
    const rows = filteredDocuments.map(d => 
      `"${d.name}","${d.category}","${d.status}","${d.expertName}","${d.sector}","${d.registryNumber || ''}","${d.uploadDate}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `itb_registry_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    toast({ title: "ዳውንሎድ ተጀምሯል", description: "መዝገቡ ወደ CSV ተቀይሮ እየወረደ ነው" });
  };

  const handleOpenFile = (file: UploadedFile) => {
    if (!file.fileUrl) return;
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${file.fileUrl}" frameborder="0" style="border:0; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="h-20 bg-white border-b flex items-center px-8 shrink-0 sticky top-0 z-[100] shadow-sm">
        <div className="flex flex-col">
          <h1 className="text-sm font-black text-[#1e3a8a] uppercase leading-none">የኢኖቬሽንና ቴክኖሎጂ ቢሮ</h1>
          <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">ITB DIGITAL PORTAL V6.0.0</span>
        </div>

        <div className="flex-1 flex justify-center px-12">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <Input 
              value={globalSearch} 
              onChange={(e) => setGlobalSearch(e.target.value)} 
              placeholder="በስም፣ በቁጥር ወይም በጉዳይ ይፈልጉ..." 
              className="w-full h-11 pl-11 pr-4 bg-slate-50 border-none rounded-full text-xs font-bold focus-visible:ring-1 focus-visible:ring-[#1e3a8a]/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleExportCSV} title="መዝገቡን ወደ CSV ቀይር" className="h-10 w-10 text-slate-400 hover:text-[#1e3a8a]">
            <FileSpreadsheet className="w-5 h-5" />
          </Button>
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[10px] font-black text-[#1e3a8a] uppercase">{user?.displayName}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase">{userProfile?.sector?.replace(/_/g, ' ')}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 p-0 rounded-full border shadow-sm">
                <Avatar className="h-full w-full">
                  <AvatarFallback className="bg-[#1e3a8a] text-white text-[10px] font-black">
                    {user?.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-none shadow-2xl bg-white">
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center w-full p-3 rounded-xl font-bold text-[11px] cursor-pointer hover:bg-slate-50">
                  <ShieldCheck className="w-4 h-4 mr-2 text-blue-600" /> የሥራ ሂደት ቁጥጥር
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 font-bold p-3 rounded-xl cursor-pointer hover:bg-red-50 text-[11px]">
                <LogOut className="w-4 h-4 mr-2" /> ውጣ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 p-8 space-y-12 max-w-7xl mx-auto w-full">
        {/* SECTION 1: BPMN ARCHITECT */}
        <section className="space-y-8 animate-in fade-in duration-700">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">የአገልግሎቱ ስም</label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="የአገልግሎት ስም..." 
                  className="h-14 bg-slate-50 border-none rounded-2xl text-xs font-bold px-6"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">የሂደቱ ዝርዝር ተግባር</label>
                <Textarea 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  placeholder="ዝርዝሩን እዚህ ያስገቡ..." 
                  className="min-h-[120px] bg-slate-50 border-none rounded-2xl text-xs font-medium p-6 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-10">
              <Button onClick={handleGenerate} className="flex-1 h-16 bg-[#4c1d95] hover:bg-[#4c1d95]/90 rounded-2xl text-[12px] font-black uppercase shadow-2xl tracking-widest">
                ዲያግራም አመንጪ
              </Button>
              <Button onClick={handleSaveToVault} disabled={!xmlResult || isSaving} variant="outline" className="h-16 px-10 rounded-2xl border-2 border-slate-100 font-black text-[11px] uppercase flex items-center gap-3">
                <Save className="w-5 h-5" /> {isSaving ? "በመመዝገብ ላይ..." : "መዝግብ (Save)"}
              </Button>
            </div>
          </Card>

          <Card className="min-h-[850px] rounded-[3.5rem] border-none shadow-2xl bg-white relative overflow-hidden">
            {xmlResult ? (
              <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none">
                <BrainCircuit className="w-24 h-24 mb-6 text-[#1e3a8a]" />
                <p className="text-[14px] font-black uppercase tracking-[0.5em] text-[#1e3a8a]">የሥራ ሂደት ዲያግራም</p>
              </div>
            )}
          </Card>
        </section>

        {/* SECTION 2: INTELLIGENCE HUB */}
        <section className="pt-20 space-y-10 animate-in slide-in-from-bottom-10 duration-1000">
           <div className="h-px bg-slate-200 w-full mb-10" />
           
           <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#1e3a8a] uppercase tracking-tight">የመዝገብ ቤትና የአፈጻጸም ትንተና ማዕከል</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">INTELLIGENCE HUB • የላቀ የመረጃ ትንተና</p>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={handlePerformAIAnalysis} disabled={isAnalyzing} className="h-12 px-6 rounded-2xl bg-purple-600 text-white shadow-xl hover:bg-purple-700 font-black text-[10px] uppercase flex items-center gap-2">
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} AI ትንተና አከናውን
                </Button>
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-12 px-8 rounded-2xl bg-[#1e3a8a] text-white shadow-xl hover:bg-[#1e3a8a]/90 font-black text-[10px] uppercase flex items-center gap-2">
                      <Upload className="w-4 h-4" /> ፋይል አስገባ
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-[2.5rem] p-10 border-none shadow-2xl bg-white z-[1000]">
                    <DialogHeader>
                      <DialogTitle className="text-center font-black uppercase text-[#1e3a8a] mb-6">ሰነድ መመዝገቢያ (Vault Entry)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">የፋይል ምድብ</label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-xs">
                            <SelectValue placeholder="ምድብ ይምረጡ" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-2xl bg-white">
                            <SelectGroup>
                              <SelectLabel className="text-[10px] uppercase font-black text-slate-400">የቢሮ ፋይል ምድቦች</SelectLabel>
                              {CATEGORIES.map(cat => (
                                <SelectItem key={cat.id} value={cat.id} className="text-xs font-bold rounded-lg cursor-pointer">{cat.label}</SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="border-2 border-dashed border-slate-100 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 bg-slate-50/50 relative">
                        <Input 
                          type="file" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }} 
                          className="absolute inset-0 opacity-0 cursor-pointer h-full" 
                        />
                        {registryLoading ? (
                          <Loader2 className="w-10 h-10 animate-spin text-[#1e3a8a]" />
                        ) : (
                          <>
                            <FileText className="w-10 h-10 text-[#1e3a8a]/20" />
                            <p className="text-[10px] font-black text-slate-400 uppercase text-center">ፋይሉን እዚህ ይጫኑ</p>
                          </>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
           </header>

           {aiAnalysisResult && (
             <Card className="rounded-[2.5rem] border-none shadow-2xl bg-purple-50 p-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center justify-between">
                       <h3 className="text-lg font-black text-purple-900 uppercase">የ AI አፈጻጸም ትንተና ሪፖርት</h3>
                       <Badge className="bg-purple-600 text-white font-black px-4 h-8 rounded-full">{aiAnalysisResult.score}% ውጤታማነት</Badge>
                    </div>
                    <p className="text-sm font-bold text-purple-800 leading-relaxed whitespace-pre-wrap">{aiAnalysisResult.narrative}</p>
                    {aiAnalysisResult.focusAreas && aiAnalysisResult.focusAreas.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {aiAnalysisResult.focusAreas.map((area: string, idx: number) => (
                          <div key={idx} className="bg-white/50 p-4 rounded-xl border border-purple-100 flex items-center gap-3">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span className="text-[11px] font-black text-purple-700">{area}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
             </Card>
           )}

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between">
                  <CardTitle className="text-[12px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" /> ሳምንታዊ የቢሮ አፈጻጸም
                  </CardTitle>
                </CardHeader>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                      <YAxis hide />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="value" stroke="#1e3a8a" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-xl bg-[#1e3a8a] text-white p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-[11px] font-black uppercase tracking-widest text-white/50 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" /> ትኩረት የሚሹ ጉዳዮች (ከ70% በታች)
                  </CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  {(aiAnalysisResult?.focusAreas && aiAnalysisResult.focusAreas.length > 0) ? aiAnalysisResult.focusAreas.slice(0, 3).map((item: string, idx: number) => (
                    <div key={idx} className="bg-white/10 p-4 rounded-2xl flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5" />
                      <p className="text-[11px] font-bold leading-relaxed">{item}</p>
                    </div>
                  )) : (
                    <div className="text-[10px] font-bold text-white/40 italic py-10 text-center">የ AI ትንተና በማካሄድ እዚህ ይመልከቱ</div>
                  )}
                </div>
              </Card>
           </div>

           <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
             <div className="p-8 border-b flex items-center justify-between">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <History className="w-4 h-4" /> የቅርብ ጊዜ የቢሮ ሰነዶች
                </h3>
                <Badge variant="outline" className="rounded-full bg-blue-50 border-blue-100 text-[#1e3a8a] font-black text-[9px] px-4 h-8 uppercase">
                  SECURE DATA VAULT
                </Badge>
             </div>
             <div className="divide-y divide-slate-50">
               {isDocsLoading ? (
                 <div className="p-40 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-200" /></div>
               ) : filteredDocuments.length === 0 ? (
                 <div className="p-40 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">ምንም መረጃ አልተገኘም</div>
               ) : (
                 filteredDocuments.map(docItem => (
                   <div key={docItem.id} className="p-8 hover:bg-slate-50 transition-all flex items-center justify-between group">
                     <div className="flex items-center gap-8">
                       <div className="w-14 h-14 bg-white border-2 rounded-2xl flex items-center justify-center shadow-sm border-slate-50">
                         {docItem.category.includes('ደብዳቤ') ? <Mail className="w-7 h-7 text-blue-400" /> : <FileText className="w-7 h-7 text-slate-300" />}
                       </div>
                       <div className="space-y-1.5">
                         <div className="flex items-center gap-3">
                           <span className="text-[13px] font-black text-slate-900">{docItem.name}</span>
                           <Badge variant="outline" className="text-[7px] font-black uppercase rounded-full h-5 px-3 bg-blue-50 border-blue-100 text-blue-600">{docItem.category}</Badge>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{docItem.expertName}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase">•</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase">{docItem.sector}</span>
                            {docItem.registryNumber && (
                              <>
                                <span className="text-[8px] font-black text-slate-400 uppercase">•</span>
                                <span className="text-[8px] font-black text-[#1e3a8a] uppercase">ቁጥር፦ {docItem.registryNumber}</span>
                              </>
                            )}
                         </div>
                       </div>
                     </div>

                     <div className="flex items-center gap-8">
                       <Badge className={`h-8 px-5 rounded-full text-[8px] font-black uppercase border-none shadow-sm ${
                         docItem.status === 'በዳይሬክተር የጸደቀ' ? 'bg-green-50 text-green-600' :
                         docItem.status === 'በኃላፊ የተፈረመ' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'
                       }`}>
                         {docItem.status}
                       </Badge>
                       <div className="flex items-center gap-2">
                         <Button variant="ghost" size="icon" onClick={() => handleOpenFile(docItem)} className="h-10 w-10 rounded-xl text-[#1e3a8a]">
                           <Eye className="w-5 h-5" />
                         </Button>
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300">
                               <MoreVertical className="w-5 h-5" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 w-48 bg-white">
                              <DropdownMenuItem onClick={() => handleOpenFile(docItem)} className="font-bold text-[11px] p-3 rounded-xl cursor-pointer">
                                 <FileDown className="w-4 h-4 mr-2" /> ሰነዱን ክፈት
                              </DropdownMenuItem>
                              {(isMasterAdmin || user?.uid === docItem.uploaderId) && (
                                <DropdownMenuItem onClick={() => {setDeleteId(docItem.id); setDeleteName(docItem.name);}} className="text-red-600 font-bold text-[11px] p-3 rounded-xl cursor-pointer">
                                   <Trash2 className="w-4 h-4 mr-2" /> ሰርዝ
                                </DropdownMenuItem>
                              )}
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

      {/* MESSENGER FAB */}
      <Button 
        onClick={() => router.push('/admin')}
        className="fixed bottom-10 right-10 h-16 w-16 rounded-full bg-[#1e3a8a] shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 p-0"
      >
        <ShieldCheck className="w-7 h-7 text-white" />
      </Button>

      {/* DELETE DIALOG */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center font-black uppercase text-red-600 mb-2">እርግጠኛ ነዎት?</AlertDialogTitle>
            <AlertDialogDescription className="text-center font-bold text-slate-500 text-[11px] mb-6">
               "{deleteName}" የሚለው ፋይል ከመዝገብ ቤት እንዲሰረዝ ይፈልጋሉ? ድርጊቱ ሊመለስ አይችልም።
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-4">
            <AlertDialogCancel className="flex-1 h-12 rounded-xl font-black uppercase text-[10px]">ተመለስ</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if(deleteId && db) {
                  await deleteDocumentNonBlocking(doc(db, 'documents', deleteId));
                  setDeleteId(null);
                  toast({ title: "ተሰርዟል", description: "ሰነዱ በትክክል ተሰርዟል" });
                }
              }}
              className="flex-1 h-12 bg-red-600 hover:bg-red-700 rounded-xl font-black uppercase text-[10px]"
            >
              አጥፋ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
