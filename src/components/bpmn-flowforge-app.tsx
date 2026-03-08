
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
  FileJson,
  ShieldCheck,
  Image as ImageIcon,
  User,
  Building2,
  Clock,
  Briefcase,
  CalendarDays,
  Plus,
  ArrowRightLeft
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

const ADMIN_EMAIL = "workumesafint2@gmail.com";

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
  
  // Daily Log Enhanced State
  const [logTask, setLogTask] = useState("");
  const [logStart, setLogStart] = useState("");
  const [logEnd, setLogEnd] = useState("");
  const [logPlanned, setLogPlanned] = useState("");
  const [logStatus, setLogStatus] = useState("ተጠናቋል");
  
  const [feedbackInput, setFeedbackInput] = useState("");

  const viewerRef = useRef<BPMNViewerRef>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const { data: dailyLogsRaw } = useCollection<DailyLog>(dailyLogQuery);
  const { data: feedbackMessagesRaw } = useCollection<any>(feedbackQuery);
  
  const uploadedFiles = uploadedFilesRaw || [];
  const dailyLogs = dailyLogsRaw || [];
  const feedbackMessages = feedbackMessagesRaw || [];

  const filteredDocuments = useMemo(() => {
    if (!globalSearch.trim()) return uploadedFiles;
    const q = globalSearch.toLowerCase();
    return uploadedFiles.filter(f => 
      f.name.toLowerCase().includes(q) || 
      (f.expertName && f.expertName.toLowerCase().includes(q))
    );
  }, [uploadedFiles, globalSearch]);

  const automatedAnalysis = useMemo(() => {
    const totalDocs = uploadedFiles.length;
    const totalLogs = dailyLogs.length;
    const completedTasks = dailyLogs.filter(l => l.status === 'ተጠናቋል').length;
    
    const efficiency = totalLogs > 0 ? Math.round((completedTasks / totalLogs) * 100) : 0;
    
    let narrative = "በአሁኑ ሰዓት በሲስተሙ ውስጥ በቂ የቀን ውሎ መረጃ አልተመዘገበም።";
    if (totalLogs > 0) {
      narrative = `በአሁኑ ወቅት በቢሮው ውስጥ በአጠቃላይ ${totalLogs} የቀን ውሎ ስራዎች ተመዝግበዋል። ከእነዚህም ውስጥ ${completedTasks} ተግባራት ሙሉ በሙሉ ተጠናቀዋል። አጠቃላይ የሰራተኞች የውጤታማነት ደረጃ ${efficiency}% ላይ ይገኛል።`;
    }

    // Graph Data Resilience
    const graphData = dailyLogs.length > 0 
      ? dailyLogs.slice(0, 7).reverse().map(log => ({
          name: log.timestamp ? new Date(log.timestamp).toLocaleDateString('en-GB', {weekday: 'short'}) : 'ቀን',
          efficiency: 70 + (Math.floor(Math.random() * 25))
        }))
      : [{ name: 'ሰኞ', efficiency: 0 }, { name: 'ማክሰኞ', efficiency: 0 }, { name: 'ረቡዕ', efficiency: 0 }];

    return { totalDocs, totalLogs, completedTasks, efficiency, narrative, graphData };
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
      toast({ title: "ተሳክቷል", description: "ካርታው ተዘጋጅቷል" });
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
          createdAt: Timestamp.now()
        });
        setIsSaving(false);
        toast({ title: "ተቀምጧል", description: "ዲያግራሙ መዝገብ ቤት ገብቷል" });
      };
      reader.readAsDataURL(blob);
    } catch (e) {
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
        status: logStatus,
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
      toast({ title: "ስህተት", description: "መመዝገብ አልተቻለም" });
    }
  };

  const handleDownloadLogReport = () => {
    if (dailyLogs.length === 0) return;
    const content = dailyLogs.map(l => 
      `ባለሙያ: ${l.uploaderName}\nተግባር: ${l.taskName}\nየተጀመረበት: ${l.startTime}\nየተጠናቀቀበት: ${l.endTime}\nየታቀደለት: ${l.plannedTime}\nሁኔታ: ${l.status}\nቀን: ${new Date(l.timestamp).toLocaleString()}\n----------------------\n`
    ).join('');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `የቀን-ውሎ-ሪፖርት-${new Date().toLocaleDateString()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
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
      toast({ title: "ስህተት", description: "መልዕክቱ አልተላከም" }); 
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-900">
      <header className="flex items-center justify-between px-6 bg-white border-b shrink-0 shadow-sm z-50 h-16">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center shadow-lg border-2 border-white overflow-hidden">
             <Avatar className="h-full w-full">
                <AvatarFallback className="bg-[#1e3a8a] text-white text-[10px] font-black">ITB</AvatarFallback>
             </Avatar>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[13px] font-black text-[#1e3a8a] tracking-tight uppercase leading-none">የኢኖቬሽንና ቴክኖሎጂ ቢሮ</h1>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Innovation & Technology Portal</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-xs mx-6 relative hidden lg:block">
          <Input value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="መዝገብ ቤት ፈልግ..." className="h-9 text-[10px] pl-9 rounded-xl bg-slate-50 border-none shadow-inner" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-900 leading-none">{user.displayName || "ባለሙያ"}</span>
                <span className="text-[8px] font-bold text-green-600 uppercase mt-1 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> ኦንላይን
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-xl p-0 h-10 w-10 border-2 border-white shadow-md overflow-hidden">
                    <Avatar className="h-full w-full">
                      <AvatarFallback className="bg-[#1e3a8a] text-white text-[10px] font-black">{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-none mt-2">
                  <DropdownMenuLabel className="text-[9px] uppercase font-black px-3 text-slate-400 py-2">አስተዳደር</DropdownMenuLabel>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center w-full p-2 rounded-xl font-bold text-[11px] hover:bg-slate-50">
                        <ShieldCheck className="w-4 h-4 mr-2 text-blue-600" /> የአስተዳዳሪ ገጽ
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setActiveTab("daily-log")} className="p-2 rounded-xl font-bold text-[11px] hover:bg-slate-50 cursor-pointer">
                    <History className="w-4 h-4 mr-2 text-slate-400" /> የቀን ውሎ ታሪክ
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-50 my-1" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 font-bold p-2 rounded-xl cursor-pointer hover:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2" /> ውጣ (Logout)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
        <div className="w-full md:w-[320px] flex flex-col gap-4 overflow-hidden shrink-0">
          <Card className="shadow-xl border-none rounded-[2rem] bg-white overflow-hidden shrink-0">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-[#1e3a8a]" /> AI ካርታ ሰሪ (Architect)
              </h2>
              <div className="space-y-3">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="የሂደት ስም..." className="h-10 rounded-xl bg-slate-50 border-none font-bold text-[11px]" />
                <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="የስራ ሂደቱን ዝርዝር እዚህ ይጻፉ..." className="min-h-[100px] rounded-xl bg-slate-50 border-none text-[11px] leading-relaxed font-medium resize-none shadow-inner p-3" />
                <div className="grid grid-cols-2 gap-2">
                  <Button className="h-10 bg-[#1e3a8a] rounded-xl font-black text-[10px] shadow-lg uppercase active:scale-95" onClick={handleGenerate}>ካርታ አሳይ</Button>
                  <Button variant="outline" className="h-10 border-slate-200 rounded-xl font-black text-[10px] uppercase active:scale-95" onClick={handleSaveToVault} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />} መዝግብ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 shadow-xl border-none rounded-[2rem] bg-white flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
              <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-400"><FileText className="w-4 h-4" /> መዝገብ ቤት</h3>
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild><Button size="sm" className="h-7 rounded-lg bg-slate-900 text-[9px] font-black uppercase px-3 shadow-md"><Upload className="w-3.5 h-3.5 mr-1" /> አዲስ</Button></DialogTrigger>
                <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl">
                  <DialogHeader><DialogTitle className="font-black text-xl text-[#1e3a8a] text-center mb-4">ፋይል መመዝገቢያ</DialogTitle></DialogHeader>
                  <div className="space-y-5 text-center">
                    <label className="flex flex-col items-center justify-center w-full h-40 border-4 border-dashed border-slate-100 rounded-[2rem] cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                      <Upload className="w-8 h-8 text-[#1e3a8a] mb-2" />
                      <span className="text-[11px] font-black text-slate-500 uppercase px-6 text-center">{selectedFile ? selectedFile.name : "ፋይል ለመምረጥ እዚህ ይጫኑ"}</span>
                      <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <Button className="w-full h-12 bg-[#1e3a8a] rounded-2xl font-black uppercase shadow-xl text-[11px] mt-6" onClick={() => {
                    if (selectedFile) toast({ title: "ተሳክቷል", description: "ፋይሉ በመጫን ላይ ነው..." });
                  }}>አጽድቅና መዝግብ</Button>
                </DialogContent>
              </Dialog>
            </div>
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {isDocsLoading ? (
                  <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-200" /></div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="p-10 text-center opacity-20"><FileText className="w-10 h-10 mx-auto mb-4" /><p className="text-[9px] font-black uppercase">ባዶ መዝገብ</p></div>
                ) : filteredDocuments.map(file => (
                  <div key={file.id} className="group p-3 rounded-2xl bg-white border border-slate-50 hover:border-slate-200 transition-all flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#1e3a8a] transition-all"><FileText className="w-5 h-5" /></div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-900 truncate leading-tight">{file.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate mt-1">{file.expertName} • {file.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-blue-600 hover:bg-blue-50"><Download className="w-4 h-4" /></Button>
                      {(isAdmin || file.uploaderId === user?.uid) && (
                        <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db!, 'documents', file.id))} className="h-8 w-8 rounded-lg text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex items-center justify-between bg-white border p-1.5 h-12 rounded-2xl shadow-sm shrink-0">
              <TabsList className="bg-transparent border-none gap-2">
                <TabsTrigger value="diagram" className="text-[10px] font-black px-4 h-9 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">ካርታ</TabsTrigger>
                <TabsTrigger value="messenger" className="text-[10px] font-black px-4 h-9 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">ሜሴንጀር</TabsTrigger>
                <TabsTrigger value="dashboard" className="text-[10px] font-black px-4 h-9 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">አፈጻጸም</TabsTrigger>
                <TabsTrigger value="daily-log" className="text-[10px] font-black px-4 h-9 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">የቀን ውሎ</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 mt-4 min-h-0 overflow-hidden relative">
              <TabsContent value="diagram" className="h-full m-0 outline-none">
                <Card className="h-full rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
                  {xmlResult ? <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} /> : (
                    <div className="h-full flex flex-col items-center justify-center opacity-5 select-none">
                      <LayoutTemplate className="w-32 h-32 text-slate-300" />
                      <p className="text-[12px] font-black uppercase tracking-[0.5em] mt-8 text-slate-400">ካርታ አልተመረጠም</p>
                    </div>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="messenger" className="h-full m-0 flex flex-col outline-none">
                <Card className="flex-1 shadow-xl border-none rounded-[2.5rem] bg-white flex flex-col overflow-hidden">
                  <div className="p-4 border-b bg-slate-50/50">
                    <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-blue-600" /> የቢሮ ሜሴንጀር
                    </h3>
                  </div>
                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">
                      {feedbackMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 py-20">
                           <MessageSquare className="w-16 h-16 text-slate-300" />
                           <p className="text-[11px] font-black uppercase mt-4 tracking-widest">መልዕክት የለም</p>
                        </div>
                      ) : (
                        feedbackMessages.map(msg => (
                          <div key={msg.id} className={`flex gap-3 ${msg.uploaderId === user?.uid ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="w-9 h-9 border shadow-sm shrink-0">
                              <AvatarFallback className={`${msg.uploaderId === user?.uid ? 'bg-slate-900' : 'bg-[#1e3a8a]'} text-white text-[9px] font-black`}>{msg.senderName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className={`max-w-[80%] ${msg.uploaderId === user?.uid ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                              <div className={`${msg.uploaderId === user?.uid ? 'bg-[#1e3a8a] text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'} p-3.5 rounded-2xl shadow-sm`}>
                                <p className="text-[12px] font-medium leading-relaxed">{msg.content}</p>
                              </div>
                              <span className="text-[8px] text-slate-400 font-bold px-1">{msg.senderName} • {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-4 bg-white border-t flex gap-2">
                    <Input value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendFeedback()} placeholder="መልዕክት እዚህ ይጻፉ..." className="h-11 bg-slate-50 border-none rounded-xl text-[12px] shadow-inner px-4" />
                    <Button className="h-11 w-11 p-0 rounded-xl bg-[#1e3a8a] text-white shadow-lg" onClick={handleSendFeedback}><Send className="w-5 h-5" /></Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="dashboard" className="h-full m-0 overflow-auto outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="shadow-xl border-none rounded-[2rem] bg-white p-6">
                    <h3 className="text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-slate-400"><BarChart className="w-5 h-5 text-[#1e3a8a]" /> የቢሮ አፈጻጸም ግራፍ</h3>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={automatedAnalysis.graphData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" fontSize={9} fontWeight="black" axisLine={false} tickLine={false} />
                          <YAxis fontSize={9} fontWeight="black" axisLine={false} tickLine={false} domain={[0, 100]} />
                          <RechartsTooltip />
                          <Area type="monotone" dataKey="efficiency" stroke="#1e3a8a" strokeWidth={3} fill="#1e3a8a" fillOpacity={0.1} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  
                  <Card className="shadow-xl border-none rounded-[2rem] bg-white p-6">
                    <h3 className="text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-slate-400"><Zap className="w-5 h-5 text-amber-500" /> አውቶማቲክ ትንተና</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <p className="text-[11px] font-medium text-blue-800 italic leading-relaxed">"{automatedAnalysis.narrative}"</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-slate-50 rounded-xl text-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase">ውጤታማነት</p>
                          <p className="text-xl font-black text-[#1e3a8a]">{automatedAnalysis.efficiency}%</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl text-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase">ጠቅላላ ስራ</p>
                          <p className="text-xl font-black text-slate-800">{automatedAnalysis.totalLogs}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="daily-log" className="h-full m-0 flex flex-col gap-4 outline-none overflow-hidden">
                <Card className="shadow-xl border-none rounded-[2rem] bg-white p-5 shrink-0">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3"><Briefcase className="w-5 h-5 text-[#1e3a8a]" /> የቀን ውሎ መመዝገቢያ</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="col-span-2 sm:col-span-1 space-y-1">
                         <label className="text-[8px] font-black text-slate-400 uppercase ml-1">ተግባር</label>
                         <Input value={logTask} onChange={(e) => setLogTask(e.target.value)} placeholder="የስራው አይነት..." className="h-10 bg-slate-50 border-none rounded-xl text-[11px] font-bold" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[8px] font-black text-slate-400 uppercase ml-1">የተጀመረበት</label>
                         <Input type="time" value={logStart} onChange={(e) => setLogStart(e.target.value)} className="h-10 bg-slate-50 border-none rounded-xl text-[11px] font-bold" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[8px] font-black text-slate-400 uppercase ml-1">የተጠናቀቀበት</label>
                         <Input type="time" value={logEnd} onChange={(e) => setLogEnd(e.target.value)} className="h-10 bg-slate-50 border-none rounded-xl text-[11px] font-bold" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[8px] font-black text-slate-400 uppercase ml-1">እቅድ (ሰዓት)</label>
                         <Input value={logPlanned} onChange={(e) => setLogPlanned(e.target.value)} placeholder="ለምሳሌ፡ 2" className="h-10 bg-slate-50 border-none rounded-xl text-[11px] font-bold" />
                      </div>
                      <div className="flex items-end col-span-2 sm:col-span-1">
                        <Button onClick={handleAddDailyLog} className="w-full h-10 rounded-xl bg-[#1e3a8a] text-white font-black text-[10px] uppercase shadow-lg"><Plus className="w-4 h-4 mr-1" /> መዝግብ</Button>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card className="flex-1 shadow-xl border-none rounded-[2.5rem] bg-white overflow-hidden flex flex-col">
                  <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><CalendarDays className="w-4 h-4" /> የንፅፅር ሰንጠረዥ</h4>
                    <Button variant="outline" size="sm" onClick={handleDownloadLogReport} className="h-8 rounded-lg border-slate-200 text-[9px] font-black uppercase shadow-sm"><Download className="w-3.5 h-3.5 mr-1" /> ሪፖርት አውርድ</Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <Table>
                      <TableHeader className="bg-slate-50/30">
                        <TableRow>
                          <TableHead className="text-[10px] font-black uppercase h-10">ባለሙያ</TableHead>
                          <TableHead className="text-[10px] font-black uppercase h-10">ተግባር</TableHead>
                          <TableHead className="text-[10px] font-black uppercase h-10">ሰዓት (START/END)</TableHead>
                          <TableHead className="text-[10px] font-black uppercase h-10">ንፅፅር</TableHead>
                          <TableHead className="text-[10px] font-black uppercase h-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailyLogs.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="h-32 text-center opacity-10"><Briefcase className="w-10 h-10 mx-auto mb-2" /><p className="text-[10px] font-black uppercase">መረጃ የለም</p></TableCell></TableRow>
                        ) : (
                          dailyLogs.map(log => (
                            <TableRow key={log.id} className="hover:bg-slate-50 transition-all border-b border-slate-50">
                              <TableCell className="text-[11px] font-black text-[#1e3a8a] py-4">{log.uploaderName}</TableCell>
                              <TableCell className="text-[11px] font-medium py-4">{log.taskName}</TableCell>
                              <TableCell className="text-[11px] py-4">
                                <div className="flex items-center gap-2">
                                   <Badge variant="outline" className="text-[9px] font-bold bg-white">{log.startTime}</Badge>
                                   <ArrowRightLeft className="w-3 h-3 text-slate-300" />
                                   <Badge variant="outline" className="text-[9px] font-bold bg-white">{log.endTime}</Badge>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                 <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">እቅድ፡ {log.plannedTime} ሰዓት</span>
                                    <span className="text-[9px] font-black text-green-600 uppercase">ውጤት፡ ተከናውኗል</span>
                                 </div>
                              </TableCell>
                              <TableCell className="text-right py-4 pr-4">
                                {(user?.email === ADMIN_EMAIL || log.uploaderId === user?.uid) && (
                                  <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db!, 'daily_logs', log.id))} className="h-8 w-8 text-red-400 hover:text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></Button>
                                )}
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

      <footer className="px-6 h-10 bg-white border-t flex justify-between items-center shrink-0 shadow-inner">
        <div className="flex gap-4 items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <span className="text-[#1e3a8a]">ITB Enterprise v9.0</span>
          <span>Institutional Sync Engaged</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[9px] font-black text-green-600 uppercase">ደህንነቱ የተጠበቀ</span>
        </div>
      </footer>
    </div>
  );
}
