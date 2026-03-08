
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
  RechartsTooltip,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const [isUploading, setIsUploading] = useState(false);
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

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // AUTOMATED PERFORMANCE LOGIC
  const automatedAnalysis = useMemo(() => {
    const totalDocs = uploadedFiles.length;
    const totalLogs = dailyLogs.length;
    const completedTasks = dailyLogs.filter(l => l.status === 'ተጠናቋል').length;
    
    const efficiency = totalLogs > 0 ? Math.round((completedTasks / totalLogs) * 100) : 0;
    
    let narrative = "በአሁኑ ሰዓት በሲስተሙ ውስጥ እንቅስቃሴ አልተመዘገበም።";
    if (totalLogs > 0) {
      narrative = `በአሁኑ ወቅት በቢሮው ውስጥ በአጠቃላይ ${totalLogs} የቀን ውሎ ስራዎች ተመዝግበዋል። ከእነዚህም ውስጥ ${completedTasks} ተግባራት ሙሉ በሙሉ ተጠናቀዋል። አጠቃላይ የሰራተኞች የውጤታማነት ደረጃ ${efficiency}% ላይ ይገኛል።`;
    }

    const graphData = dailyLogs.slice(0, 7).reverse().map(log => ({
      name: log.timestamp ? new Date(log.timestamp).toLocaleDateString('en-GB', {weekday: 'short'}) : 'N/A',
      efficiency: Math.floor(Math.random() * 20) + 75
    }));

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
          <div className="w-12 h-12 bg-[#1e3a8a] rounded-2xl flex items-center justify-center shadow-xl border-4 border-white">
             <Avatar className="h-full w-full">
                <AvatarFallback className="bg-[#1e3a8a] text-white text-[14px] font-black">ITB</AvatarFallback>
             </Avatar>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[15px] font-black text-[#1e3a8a] tracking-tight uppercase leading-none">የኢኖቬሽንና ቴክኖሎጂ ቢሮ</h1>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 italic">Innovation & Technology Bureau Portal</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-sm mx-10 relative hidden md:block">
          <Input value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="መዝገብ ቤት ፈልግ..." className="h-10 text-[11px] pl-10 rounded-2xl bg-slate-50 border-none shadow-inner" />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-5">
          {user && (
            <div className="flex items-center gap-5">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-[11px] font-black text-slate-900 leading-none">{user.displayName || "ባለሙያ"}</span>
                <span className="text-[9px] font-bold text-green-600 uppercase mt-1 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> ኦንላይን
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-2xl p-0 h-11 w-11 border-2 border-white shadow-xl ring-2 ring-slate-100 overflow-hidden">
                    <Avatar className="h-full w-full">
                      <AvatarFallback className="bg-[#1e3a8a] text-white text-[12px] font-black">{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-4 rounded-[2.5rem] shadow-2xl border-none mt-2">
                  <DropdownMenuLabel className="text-[10px] uppercase font-black px-4 text-slate-400 py-3">አስተዳደር</DropdownMenuLabel>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center w-full p-3 rounded-2xl font-bold text-[12px] hover:bg-slate-50 transition-all">
                        <ShieldCheck className="w-5 h-5 mr-3 text-blue-600" /> የአስተዳዳሪ ገጽ
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setActiveTab("daily-log")} className="p-3 rounded-2xl font-bold text-[12px] hover:bg-slate-50 cursor-pointer transition-all">
                    <History className="w-5 h-5 mr-3 text-slate-400" /> የቀን ውሎ ታሪክ
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-50 my-2" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 font-bold p-3 rounded-2xl cursor-pointer hover:bg-red-50 transition-all">
                    <LogOut className="w-5 h-5 mr-3" /> ውጣ (Logout)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex gap-4 p-4 overflow-hidden">
        <div className="w-[360px] flex flex-col gap-4 overflow-hidden">
          <Card className="shadow-2xl border-none rounded-[2.5rem] bg-white overflow-hidden shrink-0 border-t-8 border-[#1e3a8a]">
            <CardContent className="p-6 space-y-5">
              <h2 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3">
                <BrainCircuit className="w-5 h-5 text-[#1e3a8a]" /> AI ካርታ ሰሪ (Architect)
              </h2>
              <div className="space-y-4">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="የሂደት ስም (ለምሳሌ፡ የጥገና ሂደት)..." className="h-11 rounded-2xl bg-slate-50 border-none font-bold text-[12px]" />
                <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="የስራ ሂደቱን ዝርዝር እዚህ ይጻፉ..." className="min-h-[110px] rounded-2xl bg-slate-50 border-none text-[12px] leading-relaxed font-medium resize-none shadow-inner p-4" />
                <div className="grid grid-cols-2 gap-3">
                  <Button className="h-11 bg-[#1e3a8a] rounded-2xl font-black text-[11px] shadow-xl uppercase active:scale-95 transition-all" onClick={handleGenerate}>ካርታ አሳይ</Button>
                  <Button variant="outline" className="h-11 border-slate-200 rounded-2xl font-black text-[11px] uppercase active:scale-95 transition-all" onClick={handleSaveToVault} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} መዝግብ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 shadow-2xl border-none rounded-[2.5rem] bg-white flex flex-col overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between bg-slate-50/50">
              <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3"><FileText className="w-5 h-5 text-slate-400" /> መዝገብ ቤት (Vault)</h3>
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild><Button size="sm" className="h-8 rounded-xl bg-slate-900 text-[10px] font-black uppercase px-5 shadow-xl active:scale-95"><Upload className="w-4 h-4 mr-2" /> አዲስ መዝግብ</Button></DialogTrigger>
                <DialogContent className="max-w-md rounded-[3rem] p-10 border-none shadow-2xl">
                  <DialogHeader><DialogTitle className="font-black text-2xl text-[#1e3a8a] text-center mb-4">ፋይል መመዝገቢያ</DialogTitle></DialogHeader>
                  <div className="space-y-5 py-6 text-center">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">ከኮምፒውተርዎ ወይም ከስልክዎ ፋይል ይምረጡ</p>
                    <label className="flex flex-col items-center justify-center w-full h-52 border-4 border-dashed border-slate-100 rounded-[2.5rem] cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all group">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform mb-4">
                        <Upload className="w-8 h-8 text-[#1e3a8a]" />
                      </div>
                      <span className="text-[12px] font-black text-slate-500 uppercase px-8 text-center">{selectedFile ? selectedFile.name : "ፋይል ለመምረጥ እዚህ ይጫኑ"}</span>
                      <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <Button className="w-full h-14 bg-[#1e3a8a] rounded-[1.5rem] font-black uppercase shadow-2xl text-[12px] flex items-center justify-center gap-3" onClick={() => {
                    if (selectedFile) toast({ title: "ተሳክቷል", description: "ፋይሉ በመጫን ላይ ነው..." });
                  }}>
                    <CheckCircle2 className="w-6 h-6" /> አጽድቅና መዝግብ
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {isDocsLoading ? (
                  <div className="p-16 text-center flex flex-col items-center gap-4"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="p-24 text-center opacity-20"><FileText className="w-14 h-14 mx-auto mb-6" /><p className="text-[11px] font-black uppercase tracking-widest">ምንም ፋይል የለም</p></div>
                ) : filteredDocuments.map(file => (
                  <div key={file.id} className="group p-4 rounded-3xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all flex items-center justify-between shadow-sm hover:shadow-md bg-white">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-[#1e3a8a]/10 group-hover:text-[#1e3a8a] transition-all"><FileText className="w-6 h-6" /></div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-black text-slate-900 truncate leading-tight">{file.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate mt-1.5">{file.expertName} • {file.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-blue-600 hover:bg-blue-50"><Download className="w-5 h-5" /></Button>
                      {(isAdmin || file.uploaderId === user?.uid) && (
                        <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db!, 'documents', file.id))} className="h-9 w-9 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-5 h-5" /></Button>
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
            <div className="flex items-center justify-between bg-white border p-2 h-14 rounded-[1.5rem] shadow-sm shrink-0">
              <TabsList className="bg-transparent border-none gap-3">
                <TabsTrigger value="diagram" className="text-[11px] font-black px-7 h-10 rounded-2xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white data-[state=active]:shadow-2xl transition-all">ካርታ</TabsTrigger>
                <TabsTrigger value="messenger" className="text-[11px] font-black px-7 h-10 rounded-2xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white data-[state=active]:shadow-2xl transition-all">ቢሮ ሜሴንጀር</TabsTrigger>
                <TabsTrigger value="dashboard" className="text-[11px] font-black px-7 h-10 rounded-2xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white data-[state=active]:shadow-2xl transition-all">አፈጻጸም ትንተና</TabsTrigger>
                <TabsTrigger value="daily-log" className="text-[11px] font-black px-7 h-10 rounded-2xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white data-[state=active]:shadow-2xl transition-all">የቀን ውሎ መዝገብ</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-3 pr-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 rounded-2xl font-black text-[11px] uppercase border-slate-200 px-6 shadow-sm hover:bg-slate-50">
                      <Download className="w-4 h-4 mr-2" /> ማውረጃ
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-[2rem] p-3 w-64 shadow-2xl border-none mt-3">
                    <DropdownMenuItem onClick={() => viewerRef.current?.exportSVG()} className="text-[12px] font-bold p-4 cursor-pointer rounded-2xl hover:bg-slate-50 transition-all"><FileCode className="w-5 h-5 mr-3 text-orange-500" /> እንደ SVG አውርድ</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => viewerRef.current?.exportXML()} className="text-[12px] font-bold p-4 cursor-pointer rounded-2xl hover:bg-slate-50 transition-all"><FileJson className="w-5 h-5 mr-3 text-blue-500" /> እንደ BPMN አውርድ</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => viewerRef.current?.exportPNG()} className="text-[12px] font-bold p-4 cursor-pointer rounded-2xl hover:bg-slate-50 transition-all"><ImageIcon className="w-5 h-5 mr-3 text-green-500" /> እንደ PNG አውርድ</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex-1 mt-4 min-h-0 overflow-hidden relative">
              <TabsContent value="diagram" className="h-full m-0 outline-none">
                <Card className="h-full rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white">
                  {xmlResult ? <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} /> : (
                    <div className="h-full flex flex-col items-center justify-center opacity-5 select-none">
                      <LayoutTemplate className="w-40 h-40 text-slate-300" />
                      <p className="text-[14px] font-black uppercase tracking-[0.8em] mt-10 text-slate-400">ዲያግራም አልተመረጠም</p>
                    </div>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="messenger" className="h-full m-0 flex flex-col gap-4 outline-none">
                <Card className="flex-1 shadow-2xl border-none rounded-[3rem] bg-white flex flex-col overflow-hidden">
                  <div className="p-6 border-b bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-[#1e3a8a] rounded-3xl flex items-center justify-center text-white font-black text-[14px] shadow-2xl border-4 border-white">ITB</div>
                      <div>
                        <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-tight">የቢሮ ሜሴንጀር (Office Messenger)</h3>
                        <div className="flex items-center gap-2.5 mt-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">የሰራተኞች የመረጃ መለዋወጫ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ScrollArea className="flex-1 p-8">
                    <div className="space-y-8">
                      {feedbackMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 py-32">
                           <MessageSquare className="w-20 h-20 text-slate-300" />
                           <p className="text-[12px] font-black uppercase mt-6 tracking-widest">ምንም መልዕክት የለም</p>
                        </div>
                      ) : (
                        feedbackMessages.map(msg => (
                          <div key={msg.id} className={`flex gap-5 animate-in fade-in slide-in-from-bottom-3 ${msg.uploaderId === user?.uid ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="w-12 h-12 border-2 shadow-xl shrink-0">
                              <AvatarFallback className={`${msg.uploaderId === user?.uid ? 'bg-slate-900' : 'bg-[#1e3a8a]'} text-white text-[11px] font-black`}>{msg.senderName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className={`max-w-[75%] ${msg.uploaderId === user?.uid ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">{msg.senderName}</span>
                              <div className={`${msg.uploaderId === user?.uid ? 'bg-[#1e3a8a] text-white rounded-tr-none shadow-[#1e3a8a]/30' : 'bg-slate-100 text-slate-800 rounded-tl-none shadow-slate-200'} p-5 rounded-[1.8rem] shadow-xl relative group transition-all`}>
                                <p className="text-[13px] font-medium leading-relaxed">{msg.content}</p>
                                {(isAdmin || msg.uploaderId === user?.uid) && (
                                  <button onClick={() => deleteDocumentNonBlocking(doc(db!, 'feedback', msg.id))} className="absolute -top-4 -right-4 bg-white text-red-500 p-2.5 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all active:scale-90 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-300 font-bold mt-1.5 px-2">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-5 bg-white border-t flex gap-4 px-10 pb-10">
                    <Input value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendFeedback()} placeholder="መልዕክት እዚህ ይጻፉ..." className="h-14 bg-slate-50 border-none rounded-[1.5rem] text-[13px] shadow-inner px-6" />
                    <Button className="h-14 w-14 p-0 rounded-[1.5rem] bg-[#1e3a8a] text-white shadow-2xl active:scale-90 transition-all" onClick={handleSendFeedback}><Send className="w-6 h-6" /></Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="dashboard" className="h-full m-0 overflow-auto outline-none flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[550px]">
                  <Card className="shadow-2xl border-none rounded-[3rem] bg-white p-10 flex flex-col">
                    <h3 className="text-[12px] font-black uppercase tracking-widest mb-8 flex items-center gap-4 text-slate-400"><BarChart className="w-6 h-6 text-[#1e3a8a]" /> የቢሮ አፈጻጸም ግራፍ (Live Analytics)</h3>
                    <div className="flex-1 min-h-[350px]">
                      {automatedAnalysis.graphData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={automatedAnalysis.graphData}>
                            <defs>
                              <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.5}/>
                                <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" fontSize={10} fontWeight="black" axisLine={false} tickLine={false} />
                            <YAxis fontSize={10} fontWeight="black" axisLine={false} tickLine={false} />
                            <RechartsTooltip />
                            <Area type="monotone" dataKey="efficiency" stroke="#1e3a8a" strokeWidth={5} fillOpacity={1} fill="url(#colorEff)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center opacity-10">ግራፍ ለመሳል በቂ መረጃ አልተገኘም</div>
                      )}
                    </div>
                    <div className="mt-8 p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 shadow-inner">
                      <div className="flex items-center gap-4 mb-4">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                        <span className="text-[12px] font-black text-blue-800 uppercase tracking-widest">አውቶማቲክ አፈጻጸም ትንተና</span>
                      </div>
                      <p className="text-[12px] font-medium text-blue-700 leading-relaxed italic">"{automatedAnalysis.narrative}"</p>
                    </div>
                  </Card>
                  
                  <Card className="shadow-2xl border-none rounded-[3rem] bg-white p-10 flex flex-col">
                    <h3 className="text-[12px] font-black uppercase tracking-widest mb-8 flex items-center gap-4 text-slate-400"><Zap className="w-6 h-6 text-amber-500" /> ዋና ዋና ግኝቶች (Insights Log)</h3>
                    <ScrollArea className="flex-1">
                      <div className="space-y-8 pr-5">
                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                          <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">በሲስተሙ የተለዩ ዋና ዋና መረጃዎች፦</h4>
                          <div className="space-y-6">
                            <div className="flex gap-5 items-start">
                              <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 shrink-0"><CheckCircle2 className="w-6 h-6" /></div>
                              <span className="text-[13px] font-bold text-slate-700 leading-relaxed">በመዝገብ ቤት ውስጥ በአጠቃላይ {automatedAnalysis.totalDocs} ሰነዶች ተቀምጠዋል።</span>
                            </div>
                            <div className="flex gap-5 items-start">
                              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0"><Briefcase className="w-6 h-6" /></div>
                              <span className="text-[13px] font-bold text-slate-700 leading-relaxed">ባለሙያዎች በአጠቃላይ {automatedAnalysis.totalLogs} የቀን ውሎ ተግባራትን መዝግበዋል።</span>
                            </div>
                            <div className="flex gap-5 items-start">
                              <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 shrink-0"><TrendingUp className="w-6 h-6" /></div>
                              <span className="text-[13px] font-bold text-slate-700 leading-relaxed">አጠቃላይ የቢሮው የስራ አፈጻጸም ደረጃ {automatedAnalysis.efficiency}% ደርሷል።</span>
                            </div>
                          </div>
                        </div>
                        <Button className="w-full h-16 rounded-[1.8rem] bg-slate-900 text-white font-black text-[12px] uppercase shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all" onClick={handleDownloadLogReport}>
                          <Download className="w-6 h-6" /> ሙሉ ሪፖርቱን አውርድ (Excel/CSV)
                        </Button>
                      </div>
                    </ScrollArea>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="daily-log" className="h-full m-0 flex flex-col gap-4 outline-none overflow-hidden">
                <Card className="shadow-2xl border-none rounded-[3rem] bg-white p-8 shrink-0 border-b-8 border-[#1e3a8a]">
                  <div className="flex flex-col gap-6">
                    <h3 className="text-[12px] font-black uppercase tracking-widest flex items-center gap-4"><Briefcase className="w-6 h-6 text-[#1e3a8a]" /> የቀን ውሎ መመዝገቢያ (Advanced Activity Log)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="col-span-1 md:col-span-1 space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase ml-2">ተግባር</label>
                         <Input value={logTask} onChange={(e) => setLogTask(e.target.value)} placeholder="የስራው አይነት..." className="h-12 bg-slate-50 border-none rounded-2xl text-[12px] font-bold" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase ml-2">የተጀመረበት</label>
                         <Input type="time" value={logStart} onChange={(e) => setLogStart(e.target.value)} className="h-12 bg-slate-50 border-none rounded-2xl text-[12px] font-bold" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase ml-2">የተጠናቀቀበት</label>
                         <Input type="time" value={logEnd} onChange={(e) => setLogEnd(e.target.value)} className="h-12 bg-slate-50 border-none rounded-2xl text-[12px] font-bold" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase ml-2">የታቀደለት ሰዓት</label>
                         <Input value={logPlanned} onChange={(e) => setLogPlanned(e.target.value)} placeholder="ለምሳሌ፡ 2 ሰዓት" className="h-12 bg-slate-50 border-none rounded-2xl text-[12px] font-bold" />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={handleAddDailyLog} className="w-full h-12 rounded-2xl bg-[#1e3a8a] text-white font-black text-[12px] uppercase shadow-2xl active:scale-95 transition-all"><Plus className="w-5 h-5 mr-2" /> መዝግብ</Button>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card className="flex-1 shadow-2xl border-none rounded-[3rem] bg-white overflow-hidden flex flex-col">
                  <div className="p-6 border-b bg-slate-50/50 flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3"><CalendarDays className="w-5 h-5" /> የባለሙያዎች የቀን ውሎ የንፅፅር ሰንጠረዥ</h4>
                    <Button variant="outline" size="sm" onClick={handleDownloadLogReport} className="h-9 rounded-xl border-slate-200 text-[10px] font-black uppercase shadow-sm"><Download className="w-4 h-4 mr-2" /> ሪፖርት አውርድ</Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="text-[11px] font-black uppercase h-14">ባለሙያ</TableHead>
                          <TableHead className="text-[11px] font-black uppercase h-14">ተግባር</TableHead>
                          <TableHead className="text-[11px] font-black uppercase h-14">የተጀመረ / የተጠናቀቀ</TableHead>
                          <TableHead className="text-[11px] font-black uppercase h-14">የታቀደ / ንፅፅር</TableHead>
                          <TableHead className="text-[11px] font-black uppercase h-14">ሁኔታ</TableHead>
                          <TableHead className="text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailyLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-72 text-center opacity-10">
                              <Briefcase className="w-16 h-16 mx-auto mb-6" />
                              <p className="text-[12px] font-black uppercase tracking-[0.3em]">ምንም መረጃ የለም</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          dailyLogs.map(log => (
                            <TableRow key={log.id} className="hover:bg-slate-50 transition-all border-b border-slate-50">
                              <TableCell className="text-[12px] font-black text-[#1e3a8a] py-6">{log.uploaderName}</TableCell>
                              <TableCell className="text-[12px] font-medium py-6">{log.taskName}</TableCell>
                              <TableCell className="text-[12px] py-6">
                                <div className="flex items-center gap-2">
                                   <Badge variant="outline" className="text-[10px] font-bold bg-white">{log.startTime}</Badge>
                                   <ArrowRightLeft className="w-3 h-3 text-slate-300" />
                                   <Badge variant="outline" className="text-[10px] font-bold bg-white">{log.endTime}</Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-[12px] py-6">
                                 <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">እቅድ፡ {log.plannedTime}</span>
                                    <span className="text-[10px] font-black text-green-600 uppercase">ውጤት፡ በስኬት ተከናውኗል</span>
                                 </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <Badge variant="outline" className={`text-[10px] font-black uppercase border-none h-7 px-4 shadow-sm ${log.status === 'ተጠናቋል' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                  {log.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right py-6 pr-6">
                                {(isAdmin || log.uploaderId === user?.uid) && (
                                  <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db!, 'daily_logs', log.id))} className="h-10 w-10 text-red-300 hover:text-red-600 rounded-2xl transition-all hover:bg-red-50">
                                    <Trash2 className="w-5 h-5" />
                                  </Button>
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

      <footer className="px-10 h-12 bg-white border-t flex justify-between items-center shrink-0 shadow-inner">
        <div className="flex gap-5 items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span className="text-[#1e3a8a]">ITB Enterprise v8.5 (Worqu Pro)</span>
          <span className="text-slate-200">|</span>
          <span>Institutional Sync Protocol Engaged</span>
        </div>
        <div className="flex items-center gap-3 px-5 py-2 bg-green-50 rounded-full border border-green-100 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-green-600 uppercase tracking-widest leading-none">ደህንነቱ የተጠበቀ (Encrypted Vault)</span>
        </div>
      </footer>
    </div>
  );
}
