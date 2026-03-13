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
  Save,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Files,
  X,
  Plus,
  Building2,
  Clock,
  User,
  Eye,
  ChevronRight
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
    
    let efficiency = Math.min(99, 82 + (totalDocs * 0.3));
    const narrative = totalDocs > 0
      ? `በአሁኑ ወቅት በመዝገብ ቤት ውስጥ ${totalDocs} ሰነዶች ተመዝግበዋል። በ ${sectors.length} ዘርፎች የተከናወኑ ስራዎች የቢሮውን ዲጂታል አፈጻጸም ${efficiency.toFixed(1)}% አድርሰውታል።`
      : "መዝገብ ቤቱ ሰነዶችን በመጠባበቅ ላይ ነው።";

    const focusAreas = ["የመረጃ ጥራትን ማረጋገጥ", "የአገልግሎት ስታንዳርድ መከታተል", "የዳታ አጠቃቀምን ማሳደግ"];
    const graphData = uploadedFiles.length > 0 
      ? uploadedFiles.slice(0, 7).reverse().map((doc, idx) => ({
          name: doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'}) : `P${idx}`,
          activity: 70 + (idx * 5) + Math.floor(Math.random() * 5)
        }))
      : [{ name: 'Jan', activity: 80 }, { name: 'Feb', activity: 85 }, { name: 'Mar', activity: 90 }];

    return { totalDocs, efficiency, narrative, graphData, focusAreas };
  }, [uploadedFiles]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const handleGenerate = () => {
    if (!input.trim()) {
      toast({ title: "መረጃ ይጎድላል", description: "እባክዎ ዝርዝር ተግባራትን ይጻፉ", variant: "destructive" });
      return;
    }
    const result = generateBPMN(input, title || "የሂደት ካርታ");
    if (result) {
      setXmlResult(result);
      setActiveTab("diagram");
      toast({ title: "ተዘጋጅቷል", description: "ካርታው በተሳካ ሁኔታ ተሰርቷል።" });
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
      if (selectedFile) {
        fileUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
      }
      await addDocumentNonBlocking(collection(db, 'documents'), {
        name: finalName,
        category: upCategory || "ሪፖርት",
        fileName: selectedFile ? selectedFile.name : finalName,
        fileSize: selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "N/A",
        uploadDate: new Date().toISOString(),
        fileUrl: fileUrl,
        type: selectedFile ? selectedFile.type : 'institutional/record',
        status: 'በሂደት ላይ',
        uploaderId: user.uid,
        expertName: upExpertName || user.displayName || "ባለሙያ",
        sector: upSector || "አጠቃላይ",
        directorate: upDirectorate || "አጠቃላይ",
        team: upTeam || "አጠቃላይ",
        createdAt: Timestamp.now()
      });
      setIsSaving(false);
      setIsUploadOpen(false);
      setUpName("");
      setSelectedFile(null);
      toast({ title: "ተሳክቷል", description: "ሰነዱ በመዝገብ ቤት ገብቷል።" });
    } catch (e) {
      setIsSaving(false);
      toast({ title: "ስህተት", description: "መጫን አልተቻለም።", variant: "destructive" });
    }
  };

  const handleSaveToVault = async () => {
    if (!user || !db) return;
    const currentXml = await viewerRef.current?.getXML() || xmlResult;
    if (!currentXml) {
      toast({ title: "ካርታ የለም", description: "መጀመሪያ ካርታ ያዘጋጁ", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const dataUri = `data:application/xml;base64,${btoa(unescape(encodeURIComponent(currentXml)))}`;
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
      toast({ title: "ተቀምጧል", description: "ካርታው መዝገብ ቤት ገብቷል።" });
    } catch (e) {
      setIsSaving(false);
      toast({ title: "ስህተት", description: "መመዝገብ አልተቻለም።" });
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackInput.trim() || !user || !db) return;
    await addDocumentNonBlocking(collection(db, 'feedback'), {
      senderName: user.displayName || "ባለሙያ",
      content: feedbackInput,
      timestamp: new Date().toISOString(),
      uploaderId: user.uid,
      createdAt: Timestamp.now()
    });
    setFeedbackInput("");
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-50">
        <div className="flex flex-col items-center mx-auto text-center">
          <span className="text-[14px] font-black text-[#1e3a8a] uppercase tracking-tight mb-2">የኢኖቬሽንና ቴክኖሎጂ ቢሮ</span>
          <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center shadow-md border-2 border-white overflow-hidden">
             <div className="text-white text-[10px] font-black">ITB</div>
          </div>
        </div>

        <div className="absolute top-4 right-6 flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-white border shadow-sm overflow-hidden">
                <Avatar className="h-full w-full">
                  <AvatarFallback className="bg-[#1e3a8a] text-white text-[10px] font-black">{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-2 rounded-2xl shadow-2xl border-none">
              <DropdownMenuLabel className="text-[9px] uppercase font-black px-2 text-slate-400 pb-2">የባለሙያ መቆጣጠሪያ</DropdownMenuLabel>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center w-full p-2 rounded-xl font-bold text-[10px] hover:bg-blue-50">
                    <ShieldCheck className="w-3.5 h-3.5 mr-2 text-blue-600" /> የአስተዳዳሪ ገጽ
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-slate-50 my-1" />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 font-bold p-2 rounded-xl cursor-pointer hover:bg-red-50 text-[10px]">
                <LogOut className="w-3.5 h-3.5 mr-2" /> ውጣ (Logout)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-4 space-y-4">
        <div className="max-w-xl mx-auto relative">
          <Input 
            value={globalSearch} 
            onChange={(e) => setGlobalSearch(e.target.value)} 
            placeholder="መዝገብ ቤት ፈትሽ..." 
            className="h-11 w-full pl-11 pr-4 rounded-full border-none shadow-lg bg-white text-[11px] font-bold transition-all focus:ring-2 focus:ring-[#1e3a8a]/10"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
        </div>

        <ScrollArea className="h-full">
          <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <Card className="shadow-xl border-none rounded-[2rem] bg-white overflow-hidden">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                   <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><BrainCircuit className="w-4 h-4 text-[#1e3a8a]" /></div>
                   <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">AI ረዳት (BPMN)</h2>
                   <div className="ml-auto flex gap-1">
                     <Button variant="ghost" size="icon" className="h-7 w-7 text-red-300 hover:text-red-500" onClick={() => {setInput(""); setTitle("");}}><X className="w-3.5 h-3.5" /></Button>
                   </div>
                </div>
                <div className="space-y-3">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="የአገልግሎት ስም..." className="h-11 rounded-xl bg-slate-50 border-none font-bold text-[11px] shadow-inner" />
                  <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="ዝርዝር ተግባራት..." className="min-h-[100px] rounded-xl bg-slate-50 border-none text-[11px] font-medium leading-relaxed resize-none shadow-inner p-4" />
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="h-11 bg-[#1e3a8a] rounded-xl font-black text-[10px] shadow-lg uppercase hover:scale-[1.01] transition-transform" onClick={handleGenerate}>ካርታውን አሳይ</Button>
                    <Button variant="outline" className="h-11 border-slate-100 rounded-xl font-black text-[10px] uppercase shadow-sm flex items-center justify-center gap-2" onClick={handleSaveToVault} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} መዝግብ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-none rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="p-6 flex flex-row items-center justify-between border-b border-slate-50">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Files className="w-4 h-4" /> መዝገብ ቤት (VAULT)
                </CardTitle>
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-10 px-4 rounded-xl bg-[#1e3a8a] font-black uppercase text-[9px] shadow-md">
                      <Upload className="w-3.5 h-3.5 mr-1.5" /> ፋይል መዝግብ
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm rounded-[1.5rem] p-6 border-none shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-black text-sm text-[#1e3a8a] text-center mb-4 uppercase">የሰነድ መመዝገቢያ</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">ፋይል ይምረጡ</label>
                        <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="h-10 rounded-xl bg-slate-50 border-none text-[9px] pt-2" />
                      </div>
                      <Input value={upName} onChange={(e) => setUpName(e.target.value)} placeholder="የሰነዱ ስም (ከተፈለገ)..." className="h-10 rounded-xl bg-slate-50 border-none text-[10px] font-bold" />
                      <Input value={upSector} onChange={(e) => setUpSector(e.target.value)} placeholder="ዘርፍ (Sector)..." className="h-10 rounded-xl bg-slate-50 border-none text-[10px] font-bold" />
                      <Input value={upDirectorate} onChange={(e) => setUpDirectorate(e.target.value)} placeholder="ዳይሬክቶሬት..." className="h-10 rounded-xl bg-slate-50 border-none text-[10px] font-bold" />
                      <Input value={upTeam} onChange={(e) => setUpTeam(e.target.value)} placeholder="ቡድን (Team)..." className="h-10 rounded-xl bg-slate-50 border-none text-[10px] font-bold" />
                      <Input value={upExpertName} onChange={(e) => setUpExpertName(e.target.value)} placeholder="ባለሙያ..." className="h-10 rounded-xl bg-slate-50 border-none text-[10px] font-bold" />
                      <Button className="w-full h-11 bg-[#1e3a8a] rounded-xl font-black uppercase text-[10px] mt-2 shadow-lg" onClick={handleFileUpload} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "አጽድቅና መዝግብ"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[350px]">
                  {isDocsLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-[#1e3a8a]/20" />
                      <p className="text-[9px] font-black text-slate-300 uppercase">መረጃዎችን በመጫን ላይ...</p>
                    </div>
                  ) : filteredDocuments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 opacity-10">
                      <FileText className="w-12 h-12 text-slate-300" />
                      <p className="text-[10px] font-black uppercase mt-2">ምንም ፋይል የለም</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {filteredDocuments.map(file => (
                        <div key={file.id} className="group p-5 hover:bg-slate-50/80 transition-all flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#1e3a8a] shadow-sm transition-all">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <p className="text-[11px] font-black text-slate-900 leading-tight">{file.name}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{file.expertName || "ባለሙያ"} • {file.sector || "አጠቃላይ"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={`text-[7px] border-none px-2 h-5 font-black uppercase rounded-full ${file.status === 'የጸደቀ' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                              {file.status}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-[#1e3a8a]" asChild>
                              <a href={file.fileUrl} download={file.fileName}><Download className="w-4 h-4" /></a>
                            </Button>
                            {(isAdmin || file.uploaderId === user?.uid) && (
                              <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db!, 'documents', file.id))} className="h-8 w-8 text-red-100 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <div className="flex justify-center">
                <TabsList className="bg-white p-1 rounded-xl shadow-lg border border-slate-50 h-auto gap-1">
                  <TabsTrigger value="diagram" className="text-[9px] font-black px-6 py-2 rounded-lg uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white transition-all">ዲያግራም</TabsTrigger>
                  <TabsTrigger value="dashboard" className="text-[9px] font-black px-6 py-2 rounded-lg uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white transition-all">አፈጻጸም</TabsTrigger>
                  <TabsTrigger value="messenger" className="text-[9px] font-black px-6 py-2 rounded-lg uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white transition-all">መፃፃፊያ</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="diagram" className="m-0 outline-none">
                <Card className="min-h-[500px] rounded-[2rem] border-none shadow-xl overflow-hidden bg-white relative">
                  {xmlResult ? (
                    <>
                      <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} />
                      <div className="absolute top-4 right-4 flex gap-2 z-10">
                        <Button variant="secondary" size="sm" onClick={() => viewerRef.current?.exportSVG()} className="h-8 text-[8px] font-black uppercase rounded-lg bg-white/90 shadow-sm border">SVG</Button>
                        <Button variant="secondary" size="sm" onClick={() => viewerRef.current?.exportPNG()} className="h-8 text-[8px] font-black uppercase rounded-lg bg-white/90 shadow-sm border">PNG</Button>
                      </div>
                    </>
                  ) : (
                    <div className="h-full min-h-[500px] flex flex-col items-center justify-center opacity-5">
                      <div className="w-24 h-24 border-2 border-[#1e3a8a] border-dashed rounded-[2rem] flex items-center justify-center mb-6">
                        <FileText className="w-12 h-12" />
                      </div>
                      <p className="text-[12px] font-black uppercase tracking-widest text-slate-500">BPMN ካርታ የለም</p>
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="dashboard" className="m-0 outline-none space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="shadow-xl border-none rounded-[2rem] bg-white p-6">
                    <h3 className="text-[9px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-slate-400">
                      <BarChart className="w-4 h-4 text-[#1e3a8a]" /> የቢሮ ዲጂታል እንቅስቃሴ
                    </h3>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={automatedAnalysis.graphData}>
                          <defs>
                            <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" fontSize={8} fontWeight="bold" axisLine={false} tickLine={false} />
                          <YAxis fontSize={8} fontWeight="bold" axisLine={false} tickLine={false} />
                          <RechartsTooltip />
                          <Area type="monotone" dataKey="activity" stroke="#1e3a8a" strokeWidth={2} fillOpacity={1} fill="url(#colorAct)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="shadow-xl border-none rounded-[2rem] bg-white p-6 flex flex-col gap-6">
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <h4 className="text-[9px] font-black text-[#1e3a8a] uppercase mb-2 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> የአፈጻጸም ትንተና</h4>
                      <p className="text-[11px] font-bold text-blue-900 leading-relaxed italic">"{automatedAnalysis.narrative}"</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl text-center shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">ውጤታማነት</p>
                        <p className="text-xl font-black text-[#1e3a8a]">{automatedAnalysis.efficiency.toFixed(1)}%</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl text-center shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">ሰነዶች</p>
                        <p className="text-xl font-black text-slate-800">{automatedAnalysis.totalDocs}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                      <h4 className="text-[9px] font-black text-amber-600 uppercase mb-3 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> ትኩረት የሚሹ ጉዳዮች</h4>
                      <ul className="space-y-2">
                        {automatedAnalysis.focusAreas.map((area, i) => (
                          <li key={i} className="text-[10px] font-bold text-amber-800 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm"></div> {area}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="messenger" className="m-0 outline-none">
                <Card className="h-[500px] shadow-xl border-none rounded-[2rem] bg-white flex flex-col overflow-hidden">
                  <ScrollArea className="flex-1 p-6 bg-slate-50/10">
                    <div className="space-y-4">
                      {feedbackMessages.length === 0 ? (
                        <div className="py-16 text-center opacity-5"><MessageSquare className="w-12 h-12 mx-auto" /><p className="text-[10px] font-black uppercase mt-2">መልዕክት የለም</p></div>
                      ) : (
                        feedbackMessages.map(msg => (
                          <div key={msg.id} className={`flex gap-3 ${msg.uploaderId === user?.uid ? 'flex-row-reverse' : ''}`}>
                            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-[9px] font-black ${msg.uploaderId === user?.uid ? 'bg-slate-900' : 'bg-[#1e3a8a]'}`}>
                              {msg.senderName?.charAt(0)}
                            </div>
                            <div className={`max-w-[75%] ${msg.uploaderId === user?.uid ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                              <div className={`${msg.uploaderId === user?.uid ? 'bg-[#1e3a8a] text-white rounded-2xl rounded-tr-none' : 'bg-white text-slate-800 rounded-2xl rounded-tl-none border shadow-sm'} p-4`}>
                                <p className="text-[11px] font-medium leading-relaxed">{msg.content}</p>
                              </div>
                              <span className="text-[7px] text-slate-400 font-black px-1 uppercase">{msg.senderName} • {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-4 bg-white border-t flex gap-3">
                    <Input value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendFeedback()} placeholder="መልዕክት ይጻፉ..." className="h-11 bg-slate-50 border-none rounded-xl text-[11px] shadow-inner font-bold" />
                    <Button className="h-11 w-11 p-0 rounded-xl bg-[#1e3a8a] text-white shadow-lg hover:scale-105 transition-all" onClick={handleSendFeedback}><Send className="w-4 h-4" /></Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>

      <footer className="px-6 h-8 bg-white border-t flex justify-between items-center shrink-0 z-50">
        <div className="flex gap-3 items-center text-[7px] font-black text-slate-300 uppercase tracking-widest">
          <span className="text-[#1e3a8a]/40">ITB ENTERPRISE V5.5.0</span>
          <span className="hidden sm:inline">MASTER CONTROL</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-full border border-green-100 shadow-sm">
          <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[7px] font-black text-green-600 uppercase">SECURE INSTITUTIONAL NETWORK</span>
        </div>
      </footer>
    </div>
  );
}
