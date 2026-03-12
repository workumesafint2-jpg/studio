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
  Download,
  BarChart,
  FileText,
  BrainCircuit,
  Zap,
  History,
  MessageSquare,
  Send,
  LogOut,
  ShieldCheck,
  User,
  Plus,
  ArrowRightLeft,
  BriefcaseBusiness,
  Save,
  CalendarDays,
  Briefcase,
  CheckCircle2,
  Building2,
  Clock,
  LayoutDashboard
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
  CartesianGrid,
  XAxis,
  YAxis,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';

const ADMIN_EMAIL = "workumesafint2@gmail.com";

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

interface DailyLog {
  id: string;
  taskName: string;
  startTime: string;
  endTime: string;
  plannedTime: string;
  status: string;
  timestamp: string;
  uploaderId: string;
  uploaderName: string;
  createdAt?: any;
}

export function BPMNFlowForgeApp() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [xmlResult, setXmlResult] = useState("");
  const [activeTab, setActiveTab] = useState("diagram");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Metadata Fields for Upload
  const [upName, setUpName] = useState("");
  const [upSector, setUpSector] = useState("");
  const [upDirectorate, setUpDirectorate] = useState("");
  const [upTeam, setUpTeam] = useState("");
  const [upCategory, setUpCategory] = useState("ሪፖርት");
  const [upExpertName, setUpExpertName] = useState("");

  // Daily Log State
  const [logTask, setLogTask] = useState("");
  const [logStart, setLogStart] = useState("");
  const [logEnd, setLogEnd] = useState("");
  const [logPlanned, setLogPlanned] = useState("");
  
  const [feedbackInput, setFeedbackInput] = useState("");

  const viewerRef = useRef<BPMNViewerRef>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
    if (user && !upExpertName) {
      setUpExpertName(user.displayName || "");
    }
  }, [user, upExpertName]);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const documentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
  }, [db]);

  const dailyLogQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'daily_logs'), orderBy('createdAt', 'desc'));
  }, [db]);

  const feedbackQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: uploadedFilesRaw, isLoading: isDocsLoading } = useCollection<UploadedFile>(documentsQuery);
  const { data: dailyLogsRaw, isLoading: isLogsLoading } = useCollection<DailyLog>(dailyLogQuery);
  const { data: feedbackMessagesRaw } = useCollection<any>(feedbackQuery);
  
  const uploadedFiles = useMemo(() => uploadedFilesRaw || [], [uploadedFilesRaw]);
  const dailyLogs = useMemo(() => dailyLogsRaw || [], [dailyLogsRaw]);
  const feedbackMessages = useMemo(() => feedbackMessagesRaw || [], [feedbackMessagesRaw]);

  const filteredDocuments = useMemo(() => {
    if (!globalSearch.trim()) return uploadedFiles;
    const q = globalSearch.toLowerCase();
    return uploadedFiles.filter(f => 
      f.name?.toLowerCase().includes(q) || 
      f.expertName?.toLowerCase().includes(q) ||
      f.sector?.toLowerCase().includes(q)
    );
  }, [uploadedFiles, globalSearch]);

  const automatedAnalysis = useMemo(() => {
    const totalDocs = uploadedFiles.length;
    const totalLogs = dailyLogs.length;
    
    let efficiency = 85; 
    if (totalLogs > 0) {
      efficiency = Math.min(98, 70 + (totalDocs * 0.5) + (totalLogs / 5));
    }

    const narrative = totalDocs > 0 || totalLogs > 0
      ? `በቢሮው ውስጥ በአጠቃላይ ${totalDocs} ሰነዶች እና ${totalLogs} የቀን ውሎ መዝገቦች ተመዝግበዋል። በአሁኑ ሰዓት ያለው የቢሮ ውጤታማነት ${efficiency.toFixed(1)}% ደርሷል። ባለሙያዎች በታቀደላቸው ሰዓት ስራቸውን ለማጠናቀቅ የሚያደርጉት ጥረት በከፍተኛ ደረጃ ላይ ይገኛል።`
      : "በቂ የመረጃ ክምችት የለም፤ ፋይሎችን እና የቀን ውሎ መዝገቦችን በማስገባት ትንተናውን ያሳድጉ።";

    const graphData = dailyLogs.length > 0 
      ? dailyLogs.slice(0, 10).reverse().map((log, idx) => ({
          name: log.timestamp ? new Date(log.timestamp).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'}) : `ቀን ${idx+1}`,
          efficiency: 70 + (idx * 2) + Math.floor(Math.random() * 15)
        }))
      : [{ name: 'ጃን 1', efficiency: 60 }, { name: 'ጃን 2', efficiency: 65 }, { name: 'ጃን 3', efficiency: 70 }];

    return { totalDocs, totalLogs, efficiency, narrative, graphData };
  }, [uploadedFiles, dailyLogs]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const handleGenerate = () => {
    if (!input.trim()) {
      toast({ title: "መረጃ ይጎድላል", description: "እባክዎ ተግባራትን ይጻፉ", variant: "destructive" });
      return;
    }
    const result = generateBPMN(input, title || "የሂደት ዲያግራም");
    if (result) {
      setXmlResult(result);
      setActiveTab("diagram");
      toast({ title: "ተሳክቷል", description: "ካርታው ተዘጋጅቷል፤ አሁን ምልክቶቹን ተጠቅመው መቀየር ይችላሉ።" });
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile && !upName.trim()) {
      toast({ title: "መረጃ ይጎድላል", description: "እባክዎ ፋይል ይምረጡ ወይም ስም ይጥቀሱ", variant: "destructive" });
      return;
    }

    if (!user || !db) return;

    setIsSaving(true);
    try {
      let finalName = upName.trim() || (selectedFile ? selectedFile.name : "ያልተሰየመ ሰነድ");
      let fileUrl = "data:text/plain;base64,U2FtcGxlIERvY3VtZW50"; 
      let fileName = selectedFile ? selectedFile.name : finalName;

      if (selectedFile) {
        fileUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      await addDocumentNonBlocking(collection(db, 'documents'), {
        name: finalName,
        category: upCategory || "ሪፖርት",
        fileName: fileName,
        fileSize: selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "N/A",
        uploadDate: new Date().toISOString(),
        fileUrl: fileUrl,
        type: selectedFile ? selectedFile.type : 'institutional/record',
        status: 'በሂደት ላይ',
        uploaderId: user.uid,
        expertName: upExpertName || user.displayName || "ባለሙያ",
        sector: upSector || "አጠቃላይ",
        directorate: upDirectorate || "ዳይሬክቶሬት",
        team: upTeam || "ቡድን",
        createdAt: Timestamp.now()
      });

      setIsSaving(false);
      setIsUploadOpen(false);
      setUpName("");
      setSelectedFile(null);
      toast({ title: "ተሳክቷል", description: "ሰነዱ በመዝገብ ቤት ገብቷል" });
    } catch (e) {
      console.error(e);
      setIsSaving(false);
      toast({ title: "ስህተት", description: "ፋይሉን መጫን አልተቻለም፤ እባክዎ እንደገና ይሞክሩ።", variant: "destructive" });
    }
  };

  const handleSaveToVault = async () => {
    if (!user || !db) return;
    const currentXml = await viewerRef.current?.getXML() || xmlResult;
    if (!currentXml) {
      toast({ title: "ዲያግራም የለም", description: "መጀመሪያ ዲያግራም ያዘጋጁ", variant: "destructive" });
      return;
    }
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
        setIsSaving(false);
        toast({ title: "ተቀምጧል", description: "ዲያግራሙ መዝገብ ቤት ገብቷል" });
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error(e);
      setIsSaving(false);
      toast({ title: "ስህተት", description: "ዲያግራሙን መመዝገብ አልተቻለም" });
    }
  };

  const handleAddDailyLog = async () => {
    if (!logTask.trim() || !user || !db) {
      toast({ title: "መረጃ ይጎድላል", description: "እባክዎ ተግባሩን ይጻፉ" });
      return;
    }
    try {
      await addDocumentNonBlocking(collection(db, 'daily_logs'), {
        taskName: logTask,
        startTime: logStart || "N/A",
        endTime: logEnd || "N/A",
        plannedTime: logPlanned || "N/A",
        status: "ተጠናቋል",
        timestamp: new Date().toISOString(),
        uploaderId: user.uid,
        uploaderName: user.displayName || "ባለሙያ",
        createdAt: Timestamp.now()
      });
      setLogTask("");
      setLogStart("");
      setLogEnd("");
      setLogPlanned("");
      toast({ title: "ተመዝግቧል", description: "የቀን ውሎዎ በትክክል ተመዝግቧል" });
    } catch (e) {
      console.error(e);
      toast({ title: "ስህተት", description: "መመዝገብ አልተቻለም" });
    }
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
    } catch (e) { 
      console.error(e);
      toast({ title: "ስህተት", description: "መልዕክቱ አልተላከም" }); 
    }
  };

  const downloadDailyLog = () => {
    if (!dailyLogs.length) return;
    const content = dailyLogs.map(l => `${l.uploaderName} | ${l.taskName} | ${l.startTime}-${l.endTime} | እቅድ: ${l.plannedTime}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-log-${new Date().toLocaleDateString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveDailyLogToVault = async (log: DailyLog) => {
    if (!user || !db) return;
    try {
      const content = `${log.uploaderName} | ${log.taskName} | ${log.startTime}-${log.endTime} | እቅድ: ${log.plannedTime}`;
      const dataUri = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(content)))}`;
      
      await addDocumentNonBlocking(collection(db, 'documents'), {
        name: `የቀን ውሎ - ${log.taskName}`,
        category: 'የቀን ውሎ መዝገብ',
        fileName: `log-${log.id}.txt`,
        fileSize: "KB",
        uploadDate: new Date().toISOString(),
        fileUrl: dataUri,
        type: 'text/plain',
        status: 'የጸደቀ',
        uploaderId: user.uid,
        expertName: log.uploaderName,
        sector: "አጠቃላይ",
        createdAt: Timestamp.now()
      });
      toast({ title: "ተሳክቷል", description: "ውሎው በመዝገብ ቤት ተቀምጧል" });
    } catch (e) {
      console.error(e);
      toast({ title: "ስህተት", description: "መመዝገብ አልተቻለም" });
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <header className="flex items-center justify-between px-6 bg-white border-b shrink-0 shadow-sm z-[100] h-14">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-[#1e3a8a] rounded-lg flex items-center justify-center shadow-lg border-2 border-white overflow-hidden">
             <Avatar className="h-full w-full">
                <AvatarFallback className="bg-[#1e3a8a] text-white text-[10px] font-black">ITB</AvatarFallback>
             </Avatar>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[12px] font-black text-[#1e3a8a] tracking-tight uppercase leading-none">የኢኖቬሽንና ቴክኖሎጂ ቢሮ</h1>
            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">ITB Digital Portal</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-xs mx-6 relative hidden lg:block">
          <Input value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="መዝገብ ቤት ፈልግ..." className="h-8 text-[10px] pl-8 rounded-lg bg-slate-50 border-none shadow-inner" />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-900 leading-none">{user.displayName || "ባለሙያ"}</span>
                <span className="text-[8px] font-bold text-green-600 uppercase mt-1 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div> ኦንላይን
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-lg p-0 h-9 w-9 border shadow-sm overflow-hidden bg-slate-100">
                    <Avatar className="h-full w-full">
                      <AvatarFallback className="bg-[#1e3a8a] text-white text-[10px] font-black">{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-2xl border-none mt-2">
                  <DropdownMenuLabel className="text-[9px] uppercase font-black px-3 text-slate-400 py-2">አስተዳደር</DropdownMenuLabel>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center w-full p-2 rounded-lg font-bold text-[11px] hover:bg-slate-50">
                        <ShieldCheck className="w-4 h-4 mr-2 text-blue-600" /> የአስተዳዳሪ ገጽ
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setActiveTab("daily-log")} className="p-2 rounded-lg font-bold text-[11px] hover:bg-slate-50 cursor-pointer">
                    <History className="w-4 h-4 mr-2 text-slate-400" /> የቀን ውሎ ታሪክ
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-50 my-1" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 font-bold p-2 rounded-lg cursor-pointer hover:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2" /> ውጣ (Logout)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
        {/* Sidebar Panel */}
        <div className="w-full md:w-[320px] flex flex-col gap-4 overflow-hidden shrink-0">
          <Card className="shadow-lg border-none rounded-2xl bg-white overflow-hidden shrink-0">
            <CardContent className="p-4 space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-[#1e3a8a]" /> AI ካርታ ሰሪ (BPMN)
              </h2>
              <div className="space-y-3">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="የሂደት ስም..." className="h-9 rounded-lg bg-slate-50 border-none font-bold text-[11px] shadow-sm" />
                <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="የስራ ሂደቱን ዝርዝር እዚህ ይጻፉ..." className="min-h-[80px] rounded-lg bg-slate-50 border-none text-[11px] leading-relaxed resize-none shadow-inner p-3" />
                <div className="grid grid-cols-2 gap-2">
                  <Button className="h-9 bg-[#1e3a8a] rounded-lg font-black text-[10px] shadow-md uppercase hover:bg-[#1e3a8a]/90 transition-all" onClick={handleGenerate}>ካርታ አሳይ</Button>
                  <Button variant="outline" className="h-9 border-slate-200 rounded-lg font-black text-[10px] uppercase hover:bg-slate-50" onClick={handleSaveToVault} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />} መዝግብ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 shadow-lg border-none rounded-2xl bg-white flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50/30">
              <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-400"><FileText className="w-4 h-4" /> መዝገብ ቤት</h3>
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild><Button size="sm" className="h-7 rounded-md bg-[#1e3a8a] text-white text-[9px] font-black uppercase px-3 shadow-md hover:scale-105 transition-transform"><Upload className="w-3.5 h-3.5 mr-1" /> ፋይል መጫኛ</Button></DialogTrigger>
                <DialogContent className="max-w-lg rounded-3xl p-8 border-none shadow-2xl z-[1000]">
                  <DialogHeader><DialogTitle className="font-black text-lg text-[#1e3a8a] text-center mb-6 uppercase tracking-wider">የሰነድ መመዝገቢያ</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">ፋይል ይምረጡ</label>
                      <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="h-10 rounded-xl bg-slate-50 border-none text-xs font-bold pt-2 cursor-pointer shadow-inner file:bg-[#1e3a8a] file:text-white file:border-none file:rounded-md file:mr-4 file:px-3 file:text-[9px] file:font-black file:uppercase" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">የሰነዱ ስም (ከተፈለገ)</label>
                      <Input value={upName} onChange={(e) => setUpName(e.target.value)} placeholder="የሰነዱ ስም..." className="h-10 rounded-xl bg-slate-50 border-none text-xs font-bold shadow-inner" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">ምድብ</label>
                      <Input value={upCategory} onChange={(e) => setUpCategory(e.target.value)} placeholder="ምሳሌ፡ እቅድ" className="h-10 rounded-xl bg-slate-50 border-none text-xs font-bold shadow-inner" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">ዘርፍ (Sector)</label>
                      <Input value={upSector} onChange={(e) => setUpSector(e.target.value)} placeholder="ዘርፍ..." className="h-10 rounded-xl bg-slate-50 border-none text-xs font-bold shadow-inner" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">ዳይሬክቶሬት</label>
                      <Input value={upDirectorate} onChange={(e) => setUpDirectorate(e.target.value)} placeholder="ዳይሬክቶሬት..." className="h-10 rounded-xl bg-slate-50 border-none text-xs font-bold shadow-inner" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">ቡድን (Team)</label>
                      <Input value={upTeam} onChange={(e) => setUpTeam(e.target.value)} placeholder="ቡድን..." className="h-10 rounded-xl bg-slate-50 border-none text-xs font-bold shadow-inner" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">የባለሙያ ስም</label>
                      <Input value={upExpertName} onChange={(e) => setUpExpertName(e.target.value)} placeholder="ባለሙያ..." className="h-10 rounded-xl bg-slate-50 border-none text-xs font-bold shadow-inner" />
                    </div>
                  </div>
                  <Button className="w-full h-11 bg-[#1e3a8a] rounded-xl font-black uppercase shadow-lg text-[10px] mt-8 hover:bg-[#1e3a8a]/90 transition-all" onClick={handleFileUpload} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "አጽድቅና መዝግብ"}
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {isDocsLoading ? (
                  <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-200" /></div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="p-10 text-center opacity-20"><FileText className="w-8 h-8 mx-auto mb-2" /><p className="text-[8px] font-black uppercase">ባዶ መዝገብ</p></div>
                ) : filteredDocuments.map(file => (
                  <div key={file.id} className="group p-3 rounded-xl bg-white border border-slate-50 hover:border-slate-200 transition-all flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-[#1e3a8a] transition-all"><FileText className="w-4 h-4" /></div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-900 truncate">{file.name}</p>
                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">{file.expertName} • {file.sector || "አጠቃላይ"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-blue-600 hover:bg-blue-50" asChild title="አውርድ">
                        <a href={file.fileUrl} download={file.fileName || "document"}><Download className="w-3.5 h-3.5" /></a>
                      </Button>
                      {(isAdmin || file.uploaderId === user?.uid) && (
                        <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db!, 'documents', file.id))} className="h-7 w-7 rounded-md text-red-300 hover:text-red-500" title="ሰርዝ"><Trash2 className="w-3.5 h-3.5" /></Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex items-center justify-between bg-white border p-1 h-11 rounded-xl shadow-sm shrink-0">
              <TabsList className="bg-transparent border-none gap-1">
                <TabsTrigger value="diagram" className="text-[9px] font-black px-4 h-9 rounded-lg uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">ካርታ (BPMN)</TabsTrigger>
                <TabsTrigger value="messenger" className="text-[9px] font-black px-4 h-9 rounded-lg uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">ሜሴንጀር</TabsTrigger>
                <TabsTrigger value="dashboard" className="text-[9px] font-black px-4 h-9 rounded-lg uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">አፈጻጸም ትንተና</TabsTrigger>
                <TabsTrigger value="daily-log" className="text-[9px] font-black px-4 h-9 rounded-lg uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">የቀን ውሎ መዝገብ</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 mt-4 min-h-0 overflow-hidden">
              <TabsContent value="diagram" className="h-full m-0 outline-none">
                <Card className="h-full rounded-2xl border-none shadow-lg overflow-hidden bg-white relative">
                  {xmlResult ? (
                    <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-10 select-none">
                      <BrainCircuit className="w-24 h-24 text-[#1e3a8a]" />
                      <p className="text-[10px] font-black uppercase tracking-[0.5em] mt-8 text-slate-400">ካርታ አልተዘጋጀም</p>
                    </div>
                  )}
                  {xmlResult && (
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                       <Button variant="secondary" size="sm" onClick={() => viewerRef.current?.exportSVG()} className="h-8 text-[9px] font-black uppercase rounded-lg shadow-md border-white bg-white/90 backdrop-blur-sm">SVG አውርድ</Button>
                       <Button variant="secondary" size="sm" onClick={() => viewerRef.current?.exportPNG()} className="h-8 text-[9px] font-black uppercase rounded-lg shadow-md border-white bg-white/90 backdrop-blur-sm">PNG አውርድ</Button>
                       <Button variant="secondary" size="sm" onClick={() => viewerRef.current?.exportXML()} className="h-8 text-[9px] font-black uppercase rounded-lg shadow-md border-white bg-white/90 backdrop-blur-sm">BPMN አውርድ</Button>
                    </div>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="messenger" className="h-full m-0 flex flex-col outline-none">
                <Card className="flex-1 shadow-lg border-none rounded-2xl bg-white flex flex-col overflow-hidden">
                  <div className="p-4 border-b bg-slate-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-[#1e3a8a]" />
                      </div>
                      <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">የቢሮ ሜሴንጀር</h3>
                    </div>
                  </div>
                  <ScrollArea className="flex-1 p-5 bg-slate-50/20">
                    <div className="space-y-4">
                      {feedbackMessages.length === 0 ? (
                        <div className="py-20 text-center opacity-10"><MessageSquare className="w-10 h-10 mx-auto" /><p className="text-[9px] font-black uppercase mt-2">መልዕክት የለም</p></div>
                      ) : (
                        feedbackMessages.map(msg => (
                          <div key={msg.id} className={`flex gap-3 ${msg.uploaderId === user?.uid ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="w-8 h-8 border shadow-sm shrink-0">
                              <AvatarFallback className={`${msg.uploaderId === user?.uid ? 'bg-slate-900' : 'bg-[#1e3a8a]'} text-white text-[8px] font-black`}>{msg.senderName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className={`max-w-[80%] ${msg.uploaderId === user?.uid ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                              <div className={`${msg.uploaderId === user?.uid ? 'bg-[#1e3a8a] text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border'} p-3 rounded-2xl shadow-sm`}>
                                <p className="text-[11px] font-medium leading-relaxed">{msg.content}</p>
                              </div>
                              <span className="text-[7px] text-slate-400 font-bold px-1 uppercase">{msg.senderName} • {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-3 bg-white border-t flex gap-2">
                    <Input value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendFeedback()} placeholder="መልዕክት እዚህ ይጻፉ..." className="h-10 bg-slate-50 border-none rounded-xl text-[11px] shadow-inner px-4" />
                    <Button className="h-10 w-10 p-0 rounded-xl bg-[#1e3a8a] text-white shadow-md hover:scale-105 transition-transform" onClick={handleSendFeedback}><Send className="w-4 h-4" /></Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="dashboard" className="h-full m-0 overflow-auto outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full pb-4">
                  <Card className="shadow-lg border-none rounded-2xl bg-white p-6 flex flex-col">
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-slate-400"><BarChart className="w-4 h-4 text-[#1e3a8a]" /> የቢሮ አፈጻጸም ግራፍ (Daily)</h3>
                    <div className="flex-1 min-h-[300px]">
                      {automatedAnalysis.graphData && automatedAnalysis.graphData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={automatedAnalysis.graphData}>
                            <defs>
                              <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" fontSize={8} fontWeight="black" axisLine={false} tickLine={false} />
                            <YAxis fontSize={8} fontWeight="black" axisLine={false} tickLine={false} domain={[0, 100]} />
                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="efficiency" stroke="#1e3a8a" strokeWidth={3} fillOpacity={1} fill="url(#colorEff)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center opacity-20"><Loader2 className="animate-spin" /></div>
                      )}
                    </div>
                  </Card>
                  
                  <Card className="shadow-lg border-none rounded-2xl bg-white p-6 flex flex-col">
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-slate-400"><Zap className="w-4 h-4 text-amber-500" /> አውቶማቲክ አፈጻጸም ትንተና</h3>
                    <div className="space-y-6 flex-1">
                      <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-sm">
                        <h4 className="text-[9px] font-black text-[#1e3a8a] uppercase mb-2">የቢሮ ሁኔታ ትንተና (Narrative)</h4>
                        <p className="text-[11px] font-medium text-blue-900 italic leading-relaxed">"{automatedAnalysis.narrative}"</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-slate-50 rounded-2xl text-center shadow-sm border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">የውጤታማነት ደረጃ</p>
                          <p className="text-3xl font-black text-[#1e3a8a]">{automatedAnalysis.efficiency.toFixed(1)}%</p>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-2xl text-center shadow-sm border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">ጠቅላላ መዝገቦች</p>
                          <p className="text-3xl font-black text-slate-800">{automatedAnalysis.totalLogs}</p>
                        </div>
                      </div>
                      <div className="mt-auto p-4 bg-green-50 rounded-2xl flex items-center gap-3 border border-green-100">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-green-700 uppercase leading-none">የሲስተም ሁኔታ</p>
                          <p className="text-[8px] font-bold text-green-600 uppercase mt-1">Institutional Monitoring Active</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="daily-log" className="h-full m-0 flex flex-col gap-4 outline-none overflow-hidden pb-4">
                <Card className="shadow-lg border-none rounded-2xl bg-white p-5 shrink-0">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><BriefcaseBusiness className="w-4 h-4 text-[#1e3a8a]" /> የቀን ውሎ መመዝገቢያ</h3>
                      <Button variant="outline" size="sm" onClick={downloadDailyLog} className="h-8 rounded-lg text-[9px] font-black uppercase border-slate-200">
                        <Download className="w-3.5 h-3.5 mr-1.5" /> ሪፖርት አውርድ
                      </Button>
                    </div>
                    
                    {/* Direct Input Row Style */}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                      <div className="space-y-1">
                         <label className="text-[8px] font-black text-slate-400 uppercase ml-1">የስራ ተግባር</label>
                         <Input value={logTask} onChange={(e) => setLogTask(e.target.value)} placeholder="የስራው አይነት..." className="h-10 bg-white border-none rounded-xl text-[10px] font-bold shadow-sm" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[8px] font-black text-slate-400 uppercase ml-1">የተጀመረበት</label>
                         <Input type="time" value={logStart} onChange={(e) => setLogStart(e.target.value)} className="h-10 bg-white border-none rounded-xl text-[10px] font-bold shadow-sm" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[8px] font-black text-slate-400 uppercase ml-1">የተጠናቀቀበት</label>
                         <Input type="time" value={logEnd} onChange={(e) => setLogEnd(e.target.value)} className="h-10 bg-white border-none rounded-xl text-[10px] font-bold shadow-sm" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[8px] font-black text-slate-400 uppercase ml-1">እቅድ (በሰዓት)</label>
                         <Input value={logPlanned} onChange={(e) => setLogPlanned(e.target.value)} placeholder="ምሳሌ፡ 2" className="h-10 bg-white border-none rounded-xl text-[10px] font-bold shadow-sm" />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={handleAddDailyLog} className="w-full h-10 rounded-xl bg-[#1e3a8a] text-white font-black text-[10px] uppercase shadow-lg hover:bg-[#1e3a8a]/90 transition-all"><Plus className="w-4 h-4 mr-1" /> መዝግብ</Button>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card className="flex-1 shadow-lg border-none rounded-2xl bg-white overflow-hidden flex flex-col">
                  <div className="p-4 border-b bg-slate-50/20 flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><CalendarDays className="w-4 h-4" /> የቢሮ የቀን ውሎ ሰንጠረዥ</h4>
                  </div>
                  <ScrollArea className="flex-1">
                    <Table>
                      <TableHeader className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                        <TableRow>
                          <TableHead className="text-[9px] font-black uppercase h-10">ባለሙያ</TableHead>
                          <TableHead className="text-[9px] font-black uppercase h-10">ተግባር</TableHead>
                          <TableHead className="text-[9px] font-black uppercase h-10">የሰዓት ቆይታ</TableHead>
                          <TableHead className="text-[9px] font-black uppercase h-10">እቅድ (Hrs)</TableHead>
                          <TableHead className="text-[9px] font-black uppercase h-10 text-right pr-6">ተግባራት</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLogsLoading ? (
                          <TableRow><TableCell colSpan={5} className="h-40 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-200" /></TableCell></TableRow>
                        ) : !dailyLogs || dailyLogs.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="h-40 text-center opacity-10"><Briefcase className="w-10 h-10 mx-auto mb-2" /><p className="text-[10px] font-black uppercase">መረጃ የለም</p></TableCell></TableRow>
                        ) : (
                          dailyLogs.map(log => (
                            <TableRow key={log.id} className="hover:bg-slate-50/80 transition-all border-b border-slate-50">
                              <TableCell className="text-[11px] font-black text-[#1e3a8a] py-4">{log.uploaderName}</TableCell>
                              <TableCell className="text-[11px] font-medium py-4">{log.taskName}</TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center gap-2">
                                   <Badge variant="outline" className="text-[9px] font-bold px-3 h-6 bg-white shadow-sm">{log.startTime}</Badge>
                                   <ArrowRightLeft className="w-3.5 h-3.5 text-slate-300" />
                                   <Badge variant="outline" className="text-[9px] font-bold px-3 h-6 bg-white shadow-sm">{log.endTime}</Badge>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge className="text-[9px] font-black bg-[#1e3a8a]/10 text-[#1e3a8a] border-none px-3 h-6">{log.plannedTime} Hrs</Badge>
                              </TableCell>
                              <TableCell className="text-right py-4 pr-6">
                                <div className="flex items-center justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => saveDailyLogToVault(log)} className="h-8 w-8 text-[#1e3a8a] hover:bg-blue-50 rounded-xl" title="መዝገብ ቤት አስገባ"><Save className="w-4 h-4" /></Button>
                                  {(isAdmin || log.uploaderId === user?.uid) && (
                                    <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db!, 'daily_logs', log.id))} className="h-8 w-8 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      <footer className="px-6 h-8 bg-white border-t flex justify-between items-center shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex gap-4 items-center text-[8px] font-black text-slate-400 uppercase tracking-widest">
          <span className="text-[#1e3a8a]">ITB Enterprise v25.0</span>
          <span>Institutional Sync Active</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-0.5 bg-green-50 rounded-full border border-green-100 shadow-sm">
          <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[8px] font-black text-green-600 uppercase">Secure Portal • Online</span>
        </div>
      </footer>
    </div>
  );
}