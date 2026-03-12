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
  MessageSquare,
  Send,
  LogOut,
  ShieldCheck,
  BriefcaseBusiness,
  Save,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Files
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
  directorate?: string;
  team?: string;
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

  const feedbackQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: uploadedFilesRaw, isLoading: isDocsLoading } = useCollection<UploadedFile>(documentsQuery);
  const { data: feedbackMessagesRaw } = useCollection<any>(feedbackQuery);
  
  const uploadedFiles = useMemo(() => uploadedFilesRaw || [], [uploadedFilesRaw]);
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
    const sectors = Array.from(new Set(uploadedFiles.map(f => f.sector || "አጠቃላይ")));
    const experts = Array.from(new Set(uploadedFiles.map(f => f.expertName || "ባለሙያ")));
    
    // Efficiency simulation based on document volume and recent activity
    let efficiency = Math.min(98, 75 + (totalDocs * 0.2));
    
    const narrative = totalDocs > 0
      ? `በመዝገብ ቤት ውስጥ በአጠቃላይ ${totalDocs} ሰነዶች ተመዝግበዋል። በ ${sectors.length} ዘርፎች ውስጥ በ ${experts.length} ባለሙያዎች የተከናወኑ ስራዎች የቢሮውን ዲጂታል አፈጻጸም ${efficiency.toFixed(1)}% አድርሰውታል።`
      : "መዝገብ ቤቱ ባዶ ነው፤ ሰነዶችን በመጫን አፈጻጸሙን ይጀምሩ።";

    const focusAreas = [];
    if (totalDocs < 5) focusAreas.push("የሰነድ ምዝገባን ማሳደግ");
    if (sectors.length < 3) focusAreas.push("የተለያዩ ዘርፎችን ማሳተፍ");
    if (focusAreas.length === 0) focusAreas.push("የመረጃ ጥራትን ማረጋገጥ", "የአገልግሎት ስታንዳርድ መከታተል");

    const graphData = uploadedFiles.length > 0 
      ? uploadedFiles.slice(0, 10).reverse().map((doc, idx) => ({
          name: doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'}) : `Point ${idx+1}`,
          activity: 60 + (idx * 4) + Math.floor(Math.random() * 10)
        }))
      : [{ name: 'Point 1', activity: 60 }, { name: 'Point 2', activity: 65 }, { name: 'Point 3', activity: 70 }];

    return { totalDocs, efficiency, narrative, graphData, focusAreas };
  }, [uploadedFiles]);

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

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <header className="flex items-center justify-between px-6 bg-white border-b shrink-0 shadow-sm z-[100] h-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1e3a8a] rounded-lg flex items-center justify-center shadow-md overflow-hidden">
             <Avatar className="h-full w-full">
                <AvatarFallback className="bg-[#1e3a8a] text-white text-[9px] font-black">ITB</AvatarFallback>
             </Avatar>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[11px] font-black text-[#1e3a8a] tracking-tight uppercase leading-none">የኢኖቬሽንና ቴክኖሎጂ ቢሮ</h1>
            <span className="text-[6px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ITB DIGITAL PORTAL</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-[200px] mx-4 relative hidden sm:block">
          <Input value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="መዝገብ ቤት ፈልግ..." className="h-7 text-[9px] pl-7 rounded-lg bg-slate-50 border-none shadow-inner" />
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2">
              <div className="hidden xs:flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-900 leading-none">{user.displayName || "ባለሙያ"}</span>
                <span className="text-[7px] font-bold text-green-600 uppercase mt-0.5 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-green-500"></div> ኦንላይን
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-lg p-0 h-8 w-8 border shadow-sm overflow-hidden bg-slate-100">
                    <Avatar className="h-full w-full">
                      <AvatarFallback className="bg-[#1e3a8a] text-white text-[9px] font-black">{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 p-2 rounded-xl shadow-2xl border-none mt-2">
                  <DropdownMenuLabel className="text-[8px] uppercase font-black px-3 text-slate-400 py-2 tracking-widest">አስተዳደር</DropdownMenuLabel>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center w-full p-2 rounded-lg font-bold text-[10px] hover:bg-slate-50">
                        <ShieldCheck className="w-3.5 h-3.5 mr-2 text-blue-600" /> የአስተዳዳሪ ገጽ
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-slate-50 my-1" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 font-bold p-2 rounded-lg cursor-pointer hover:bg-red-50 text-[10px]">
                    <LogOut className="w-3.5 h-3.5 mr-2" /> ውጣ (Logout)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-3 p-3 overflow-hidden">
        {/* Sidebar Panel */}
        <div className="w-full md:w-[280px] flex flex-col gap-3 overflow-hidden shrink-0">
          <Card className="shadow-md border-none rounded-xl bg-white overflow-hidden shrink-0">
            <CardContent className="p-3.5 space-y-3">
              <h2 className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
                <BrainCircuit className="w-3.5 h-3.5 text-[#1e3a8a]" /> AI ካርታ ሰሪ (BPMN)
              </h2>
              <div className="space-y-2.5">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="የሂደት ስም..." className="h-8 rounded-lg bg-slate-50 border-none font-bold text-[10px] shadow-sm" />
                <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="የስራ ሂደቱን ዝርዝር እዚህ ይጻፉ..." className="min-h-[70px] rounded-lg bg-slate-50 border-none text-[10px] leading-relaxed resize-none shadow-inner p-2.5" />
                <div className="grid grid-cols-2 gap-2">
                  <Button className="h-8 bg-[#1e3a8a] rounded-lg font-black text-[9px] shadow-md uppercase hover:bg-[#1e3a8a]/90" onClick={handleGenerate}>ካርታ አሳይ</Button>
                  <Button variant="outline" className="h-8 border-slate-200 rounded-lg font-black text-[9px] uppercase" onClick={handleSaveToVault} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />} መዝግብ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 shadow-md border-none rounded-xl bg-white flex flex-col overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between bg-slate-50/30">
              <h3 className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-400"><Files className="w-3.5 h-3.5" /> መዝገብ ቤት</h3>
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild><Button size="sm" className="h-6 rounded-md bg-[#1e3a8a] text-white text-[8px] font-black uppercase px-2 shadow-md"><Upload className="w-3 h-3 mr-1" /> ፋይል መጫኛ</Button></DialogTrigger>
                <DialogContent className="max-w-md rounded-2xl p-6 border-none shadow-2xl">
                  <DialogHeader><DialogTitle className="font-black text-base text-[#1e3a8a] text-center mb-4 uppercase">የሰነድ መመዝገቢያ</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">ፋይል ይምረጡ</label>
                      <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="h-9 rounded-lg bg-slate-50 border-none text-[10px] pt-1.5" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">የሰነዱ ስም (ከተፈለገ)</label>
                      <Input value={upName} onChange={(e) => setUpName(e.target.value)} placeholder="የሰነዱ ስም..." className="h-9 rounded-lg bg-slate-50 border-none text-[10px]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">ምድብ</label>
                      <Input value={upCategory} onChange={(e) => setUpCategory(e.target.value)} placeholder="ምሳሌ፡ እቅድ" className="h-9 rounded-lg bg-slate-50 border-none text-[10px]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">ዘርፍ (Sector)</label>
                      <Input value={upSector} onChange={(e) => setUpSector(e.target.value)} placeholder="ዘርፍ..." className="h-9 rounded-lg bg-slate-50 border-none text-[10px]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">ባለሙያ</label>
                      <Input value={upExpertName} onChange={(e) => setUpExpertName(e.target.value)} placeholder="ባለሙያ..." className="h-9 rounded-lg bg-slate-50 border-none text-[10px]" />
                    </div>
                  </div>
                  <Button className="w-full h-9 bg-[#1e3a8a] rounded-lg font-black uppercase text-[9px] mt-6" onClick={handleFileUpload} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "አጽድቅና መዝግብ"}
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-1.5">
                {isDocsLoading ? (
                  <div className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-200" /></div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="p-10 text-center opacity-10"><FileText className="w-6 h-6 mx-auto mb-1" /><p className="text-[7px] font-black uppercase">ባዶ መዝገብ</p></div>
                ) : filteredDocuments.map(file => (
                  <div key={file.id} className="group p-2.5 rounded-lg bg-white border border-slate-50 hover:border-slate-200 transition-all flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center text-slate-400 group-hover:text-[#1e3a8a] transition-all"><FileText className="w-3.5 h-3.5" /></div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-900 truncate">{file.name}</p>
                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{file.expertName} • {file.sector}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600" asChild>
                        <a href={file.fileUrl} download={file.fileName}><Download className="w-3 h-3" /></a>
                      </Button>
                      {(isAdmin || file.uploaderId === user?.uid) && (
                        <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db!, 'documents', file.id))} className="h-6 w-6 text-red-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex items-center justify-between bg-white border p-1 h-9 rounded-lg shadow-sm shrink-0">
              <TabsList className="bg-transparent border-none gap-1">
                <TabsTrigger value="diagram" className="text-[8px] font-black px-3 h-7 rounded-md uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">ካርታ (BPMN)</TabsTrigger>
                <TabsTrigger value="messenger" className="text-[8px] font-black px-3 h-7 rounded-md uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">ሜሴንጀር</TabsTrigger>
                <TabsTrigger value="dashboard" className="text-[8px] font-black px-3 h-7 rounded-md uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">አፈጻጸም ትንተና</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 mt-3 min-h-0 overflow-hidden">
              <TabsContent value="diagram" className="h-full m-0 outline-none">
                <Card className="h-full rounded-xl border-none shadow-md overflow-hidden bg-white relative">
                  {xmlResult ? (
                    <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-10">
                      <BrainCircuit className="w-20 h-20 text-[#1e3a8a]" />
                      <p className="text-[9px] font-black uppercase mt-6 text-slate-400">ካርታ አልተዘጋጀም</p>
                    </div>
                  )}
                  {xmlResult && (
                    <div className="absolute top-3 right-3 flex gap-2 z-10">
                       <Button variant="secondary" size="sm" onClick={() => viewerRef.current?.exportSVG()} className="h-7 text-[8px] font-black uppercase rounded-md shadow-sm border-white bg-white/90">SVG</Button>
                       <Button variant="secondary" size="sm" onClick={() => viewerRef.current?.exportPNG()} className="h-7 text-[8px] font-black uppercase rounded-md shadow-sm border-white bg-white/90">PNG</Button>
                    </div>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="messenger" className="h-full m-0 flex flex-col outline-none">
                <Card className="flex-1 shadow-md border-none rounded-xl bg-white flex flex-col overflow-hidden">
                  <ScrollArea className="flex-1 p-4 bg-slate-50/20">
                    <div className="space-y-3">
                      {feedbackMessages.length === 0 ? (
                        <div className="py-20 text-center opacity-10"><MessageSquare className="w-8 h-8 mx-auto" /><p className="text-[8px] font-black uppercase mt-1">መልዕክት የለም</p></div>
                      ) : (
                        feedbackMessages.map(msg => (
                          <div key={msg.id} className={`flex gap-2.5 ${msg.uploaderId === user?.uid ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="w-7 h-7 border shadow-sm shrink-0">
                              <AvatarFallback className={`${msg.uploaderId === user?.uid ? 'bg-slate-900' : 'bg-[#1e3a8a]'} text-white text-[7px] font-black`}>{msg.senderName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className={`max-w-[80%] ${msg.uploaderId === user?.uid ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                              <div className={`${msg.uploaderId === user?.uid ? 'bg-[#1e3a8a] text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border'} p-2.5 rounded-xl shadow-sm`}>
                                <p className="text-[10px] font-medium leading-relaxed">{msg.content}</p>
                              </div>
                              <span className="text-[6px] text-slate-400 font-bold px-1 uppercase">{msg.senderName} • {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-2.5 bg-white border-t flex gap-2">
                    <Input value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendFeedback()} placeholder="መልዕክት..." className="h-9 bg-slate-50 border-none rounded-lg text-[10px] shadow-inner" />
                    <Button className="h-9 w-9 p-0 rounded-lg bg-[#1e3a8a] text-white" onClick={handleSendFeedback}><Send className="w-3.5 h-3.5" /></Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="dashboard" className="h-full m-0 overflow-auto outline-none pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="shadow-md border-none rounded-xl bg-white p-5 flex flex-col h-fit">
                    <h3 className="text-[9px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-slate-400"><BarChart className="w-3.5 h-3.5 text-[#1e3a8a]" /> የቢሮ ዲጂታል ንረት (Vault Activity)</h3>
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={automatedAnalysis.graphData}>
                          <defs>
                            <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" fontSize={7} fontWeight="black" axisLine={false} tickLine={false} />
                          <YAxis fontSize={7} fontWeight="black" axisLine={false} tickLine={false} />
                          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: '9px' }} />
                          <Area type="monotone" dataKey="activity" stroke="#1e3a8a" strokeWidth={2} fillOpacity={1} fill="url(#colorAct)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  
                  <Card className="shadow-md border-none rounded-xl bg-white p-5 flex flex-col gap-4">
                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                      <h4 className="text-[8px] font-black text-[#1e3a8a] uppercase mb-1.5 flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> የመረጃ ትንተና</h4>
                      <p className="text-[10px] font-medium text-blue-900 leading-relaxed italic">"{automatedAnalysis.narrative}"</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 bg-slate-50 rounded-xl text-center shadow-sm">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">ውጤታማነት</p>
                        <p className="text-xl font-black text-[#1e3a8a]">{automatedAnalysis.efficiency.toFixed(1)}%</p>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl text-center shadow-sm">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">ጠቅላላ ሰነዶች</p>
                        <p className="text-xl font-black text-slate-800">{automatedAnalysis.totalDocs}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                      <h4 className="text-[8px] font-black text-amber-600 uppercase mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> ትኩረት የሚሹ ጉዳዮች</h4>
                      <ul className="space-y-1.5">
                        {automatedAnalysis.focusAreas.map((area, i) => (
                          <li key={i} className="text-[9px] font-bold text-amber-800 flex items-center gap-2">
                             <div className="w-1 h-1 rounded-full bg-amber-500"></div> {area}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      <footer className="px-5 h-7 bg-white border-t flex justify-between items-center shrink-0 shadow-sm">
        <div className="flex gap-3 items-center text-[7px] font-black text-slate-400 uppercase tracking-widest">
          <span className="text-[#1e3a8a]">ITB V25.0</span>
          <span>Institution Sync</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-full border border-green-100">
          <div className="w-1 h-1 rounded-full bg-green-500"></div>
          <span className="text-[7px] font-black text-green-600 uppercase">Secure Portal • Online</span>
        </div>
      </footer>
    </div>
  );
}
