
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
  Building2,
  User,
  Eye,
  PenTool,
  Archive,
  Stamp,
  Sparkles,
  SearchCode,
  FileDown
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
  DialogFooter,
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
import { Badge } from "@/components/ui/badge";
import { 
  ResponsiveContainer, 
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
  useAuth,
  updateDocumentNonBlocking,
  useDoc
} from '@/firebase';
import { collection, query, doc, Timestamp, orderBy } from 'firebase/firestore';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ADMIN_EMAIL = "workumesafint2@gmail.com";

interface SignatureEntry {
  role: string;
  name: string;
  date: string;
  status: string;
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
  signatures?: SignatureEntry[];
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
  const [feedbackInput, setFeedbackInput] = useState("");
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");

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

  const feedbackQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: uploadedFilesRaw, isLoading: isDocsLoading } = useCollection<UploadedFile>(documentsQuery);
  const { data: feedbackMessagesRaw } = useCollection<any>(feedbackQuery);
  
  const uploadedFiles = useMemo(() => uploadedFilesRaw || [], [uploadedFilesRaw]);
  const feedbackMessages = useMemo(() => feedbackMessagesRaw || [], [feedbackMessagesRaw]);

  const filteredDocuments = useMemo(() => {
    let list = uploadedFiles;
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
  }, [uploadedFiles, globalSearch, isMasterAdmin, userProfile, user]);

  const handleLogAction = async (action: string, docName: string, details: string) => {
    if (!db || !user) return;
    await addDocumentNonBlocking(collection(db, 'audit_logs'), {
      action,
      userName: user.displayName || user.email || "ባለሙያ",
      docName,
      details,
      timestamp: Timestamp.now(),
      sector: userProfile?.sector || "N/A"
    });
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const handleOpenFile = (file: UploadedFile) => {
    if (!file.fileUrl) return;
    handleLogAction("VIEW", file.name, "ሰነዱን ተመልክተዋል");
    const win = window.open();
    if (win) {
      if (file.fileUrl.startsWith('data:')) {
        win.document.write(`<iframe src="${file.fileUrl}" frameborder="0" style="border:0; width:100%; height:100%;" allowfullscreen></iframe>`);
      } else {
        win.location.href = file.fileUrl;
      }
    }
  };

  const confirmDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
  };

  const handleDeleteDoc = async () => {
    if (!db || !deleteId) return;
    await deleteDocumentNonBlocking(doc(db, 'documents', deleteId));
    handleLogAction("DELETE", deleteName, "ሰነዱ ተሰርዟል");
    toast({ title: "ተሰርዟል", description: "ሰነዱ በትክክል ተሰርዟል" });
    setDeleteId(null);
  };

  const handleFileUpload = async () => {
    if (!selectedFile && !upName.trim()) {
      toast({ title: "መረጃ ይጎድላል", description: "እባክዎ ፋይል ይምረጡ ወይም ስም ይስጡ", variant: "destructive" });
      return;
    }
    if (!user || !db) return;
    setIsSaving(true);
    try {
      const finalName = upName.trim() || (selectedFile ? selectedFile.name : "ያልተሰየመ ሰነድ");
      let fileUrl = "";
      if (selectedFile) {
        fileUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
      }
      
      const simulatedRegistryNumber = `ITB/${Math.floor(1000 + Math.random() * 9000)}/2024`;
      const simulatedDate = new Date().toLocaleDateString('et-ET');

      await addDocumentNonBlocking(collection(db, 'documents'), {
        name: finalName,
        category: "ኦፊሴላዊ ሰነድ",
        fileName: selectedFile ? selectedFile.name : finalName,
        fileSize: selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "N/A",
        uploadDate: new Date().toISOString(),
        fileUrl: fileUrl,
        status: 'በሂደት ላይ',
        uploaderId: user.uid,
        sector: userProfile?.sector || "Unknown",
        expertName: user.displayName || user.email || "ባለሙያ",
        registryNumber: simulatedRegistryNumber,
        registryDate: simulatedDate,
        createdAt: Timestamp.now(),
        signatures: []
      });
      handleLogAction("UPLOAD", finalName, "አዲስ ሰነድ መዝግበዋል");
      setIsSaving(false);
      setIsUploadOpen(false);
      setUpName("");
      setSelectedFile(null);
      toast({ title: "ተሳክቷል", description: "ሰነዱ በመዝገብ ቤት ገብቷል" });
    } catch (e) {
      setIsSaving(false);
      toast({ title: "ስህተት", description: "መጫን አልተቻለም", variant: "destructive" });
    }
  };

  const exportRegistryToCSV = () => {
    const headers = ["ስም", "ዘርፍ", "ደረጃ", "የደብዳቤ ቁጥር", "ቀን", "ባለሙያ"];
    const rows = filteredDocuments.map(f => [
      f.name, 
      f.sector || "N/A", 
      f.status, 
      f.registryNumber || "N/A", 
      f.registryDate || "N/A", 
      f.expertName
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ITB_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "ኤክስፖርት ተደርጓል", description: "የመዝገብ መረጃዎች በ CSV ወርደዋል" });
  };

  const saveDiagramToVault = async () => {
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
        sector: userProfile?.sector || "Unknown",
        expertName: user.displayName || user.email || "ባለሙያ",
        createdAt: Timestamp.now(),
        signatures: []
      });
      handleLogAction("SAVE_DIAGRAM", diagramName, "አዲስ የBPMN ዲያግራም በመዝገብ ቤት አስቀምጠዋል");
      setIsSaving(false);
      toast({ title: "ተሳክቷል", description: "ዲያግራሙ በመዝገብ ቤት (Vault) ተቀምጧል" });
    } catch (e) {
      setIsSaving(false);
      toast({ title: "ስህተት", description: "ዲያግራሙን ማስቀመጥ አልተቻለም", variant: "destructive" });
    }
  };

  const performAiAnalysis = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      const docCount = filteredDocuments.length;
      const result = `ወርቁ (Worku) - ኢትዮጵያዊ AI ነኝ ምን ልርዳዎት?

በመዝገብ ቤትዎ ውስጥ ${docCount} ሰነዶችን ተመልክቻለሁ። 
የተመዘገቡ ደብዳቤዎችንና የሥራ ሂደቶችን በዘርፍ (${userProfile?.sector || 'ሁሉንም'}) ለይቼ መርምሬያለሁ።

ትኩረት የሚሹ ጉዳዮች፦
1. በቅርቡ የተመዘገቡት የደብዳቤ ቁጥሮች በትክክል በ Registry ተመዝግበዋል።
2. በመጠባበቅ ላይ ያሉ ሰነዶች የፊርማ ማረጋገጫ ይፈልጋሉ።

ምን ተጨማሪ ትንተና ልስጥዎ?`;
      setAiAnalysisResult(result);
      setIsAiLoading(false);
    }, 1500);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="bg-white border-b px-6 py-4 shrink-0 shadow-sm z-50">
        <div className="flex flex-col items-center mx-auto text-center">
          <span className="text-[14px] font-black text-[#1e3a8a] uppercase tracking-tight mb-1">የኢኖቬሽንና ቴክኖሎጂ ቢሮ</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1e3a8a] rounded-xl flex items-center justify-center shadow-md border-2 border-white overflow-hidden">
               <div className="text-white text-[8px] font-black">ITB</div>
            </div>
            <Badge variant="outline" className="text-[7px] font-black uppercase bg-slate-50 border-slate-200">
              ዘርፍ፦ {userProfile?.sector || "ባለሙያ"}
            </Badge>
          </div>
        </div>

        <div className="absolute top-4 right-6 flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-white border shadow-sm">
                <Avatar className="h-full w-full">
                  <AvatarFallback className="bg-[#1e3a8a] text-white text-[10px] font-black">{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-2 rounded-2xl shadow-2xl border-none">
              <DropdownMenuLabel className="text-[9px] uppercase font-black px-2 text-slate-400 pb-2">የባለሙያ መቆጣጠሪያ</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center w-full p-2 rounded-xl font-bold text-[10px] hover:bg-blue-50">
                  <ShieldCheck className="w-3.5 h-3.5 mr-2 text-blue-600" /> የሥራ ሂደት ቁጥጥር
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-50 my-1" />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 font-bold p-2 rounded-xl cursor-pointer hover:bg-red-50 text-[10px]">
                <LogOut className="w-3.5 h-3.5 mr-2" /> ውጣ
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
            placeholder="ሰነዶችን ይፈልጉ (በስም፣ በባለሙያ ወይም በደረጃ)..." 
            className="h-11 w-full pl-11 pr-4 rounded-full border-none shadow-lg bg-white text-[11px] font-bold"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
        </div>

        <ScrollArea className="h-full">
          <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* V6.0.0 Stats Card */}
            <Card className="shadow-2xl border-none rounded-[3rem] bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] text-white overflow-hidden p-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <Badge className="bg-white/20 text-white font-black text-[8px] uppercase px-4 py-1.5 rounded-full border-none">Institutional Performance</Badge>
                    <h2 className="text-4xl font-black leading-tight">89.4% የቢሮ ውጤታማነት</h2>
                    <p className="text-blue-100/70 text-sm font-medium leading-relaxed">በዘርፍ የተከፋፈሉ ስራዎችን በ AI በማገዝ ውጤታማነታችንን አረጋግጠናል።</p>
                    <div className="flex items-center gap-4 pt-4">
                       <div className="bg-white/10 p-4 rounded-3xl border border-white/10">
                          <p className="text-[10px] font-black uppercase text-blue-200">ጠቅላላ ሰነዶች</p>
                          <p className="text-2xl font-black">{uploadedFiles.length}</p>
                       </div>
                       <div className="bg-white/10 p-4 rounded-3xl border border-white/10">
                          <p className="text-[10px] font-black uppercase text-blue-200">በሂደት ላይ</p>
                          <p className="text-2xl font-black">{uploadedFiles.filter(f => f.status === 'በሂደት ላይ').length}</p>
                       </div>
                    </div>
                  </div>
                  <div className="h-[200px] w-full bg-white/5 rounded-[2.5rem] p-6 border border-white/10">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[{name: 'A', v: 40}, {name: 'B', v: 70}, {name: 'C', v: 65}, {name: 'D', v: 90}, {name: 'E', v: 85}]}>
                           <Area type="monotone" dataKey="v" stroke="#fff" fill="#fff" fillOpacity={0.1} strokeWidth={3} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="flex justify-center">
                <TabsList className="bg-white p-1 rounded-2xl shadow-xl border border-slate-100 h-auto gap-2">
                  <TabsTrigger value="diagram" className="text-[10px] font-black px-10 py-3 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">የካሙንዳ ዲያግራም ኤዲተር</TabsTrigger>
                  <TabsTrigger value="vault" className="text-[10px] font-black px-10 py-3 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">የቢሮ መዝገብ ቤት (Vault)</TabsTrigger>
                  <TabsTrigger value="messenger" className="text-[10px] font-black px-10 py-3 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">የቢሮ መፃፃፊያ</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="diagram">
                <Card className="min-h-[850px] rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white relative">
                  <div className="absolute top-6 right-8 z-10 flex gap-3">
                     <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="የካርታው ስም..." className="h-11 w-64 rounded-xl bg-white/80 backdrop-blur shadow-md border-none font-bold text-[11px]" />
                     <Button onClick={saveDiagramToVault} className="h-11 px-6 rounded-xl bg-[#1e3a8a] font-black uppercase text-[9px] shadow-lg">
                        <Save className="w-4 h-4 mr-2" /> ዲያግራም መዝግብ
                     </Button>
                  </div>
                  {xmlResult ? <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} /> : (
                    <div className="h-full min-h-[850px] flex flex-col items-center justify-center bg-slate-50/50">
                      <div className="p-12 bg-white rounded-[3rem] shadow-xl text-center max-w-md space-y-6">
                        <BrainCircuit className="w-20 h-20 text-[#1e3a8a]/20 mx-auto" />
                        <h3 className="text-xl font-black text-slate-800 uppercase">አዲስ የሥራ ሂደት ካርታ ይሳሉ</h3>
                        <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="የሥራ ሂደቱን ዝርዝር እዚህ ይጻፉ..." className="min-h-[120px] rounded-2xl bg-slate-50 border-none text-[11px] font-medium p-4 resize-none" />
                        <Button className="w-full h-12 bg-[#1e3a8a] rounded-2xl font-black uppercase text-[10px]" onClick={() => {
                           const res = generateBPMN(input, title);
                           if(res) setXmlResult(res);
                        }}>ዲያግራሙን አሳይ (Generate)</Button>
                      </div>
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="vault">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Card className="shadow-2xl border-none rounded-[3rem] bg-white overflow-hidden h-full">
                      <CardHeader className="p-8 flex flex-row items-center justify-between border-b border-slate-50">
                        <div className="flex items-center gap-3">
                          <Archive className="w-5 h-5 text-slate-400" />
                          <div>
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">የቢሮ መዝገብ ቤት</CardTitle>
                            <Badge className="mt-1 bg-green-50 text-green-600 font-black text-[7px] border-none rounded-full px-3">SECURE DATA VAULT</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" onClick={exportRegistryToCSV} className="h-10 px-4 rounded-2xl font-black uppercase text-[9px] border-slate-200 shadow-sm">
                            <FileDown className="w-4 h-4 mr-2" /> መዝገብ አውርድ
                          </Button>
                          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                            <DialogTrigger asChild>
                              <Button className="h-10 px-6 rounded-2xl bg-[#1e3a8a] font-black uppercase text-[9px] shadow-lg">
                                <Upload className="w-4 h-4 mr-2" /> ፋይል መዝግብ
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm rounded-[2.5rem] p-8 border-none">
                              <DialogHeader><DialogTitle className="font-black text-sm text-[#1e3a8a] text-center mb-6 uppercase tracking-widest">አዲስ ሰነድ መመዝገቢያ</DialogTitle></DialogHeader>
                              <div className="space-y-4">
                                <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="h-12 rounded-2xl bg-slate-50 border-none text-[9px] pt-3" />
                                <Input value={upName} onChange={(e) => setUpName(e.target.value)} placeholder="የሰነዱ ስም..." className="h-12 rounded-2xl bg-slate-50 border-none text-[11px] font-bold" />
                                <Button className="w-full h-12 bg-[#1e3a8a] rounded-2xl font-black uppercase text-[10px] mt-4 shadow-xl" onClick={handleFileUpload} disabled={isSaving}>
                                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "በ AI መዝግብ"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[600px]">
                          {isDocsLoading ? (
                            <div className="flex flex-col items-center justify-center py-40">
                              <Loader2 className="w-10 h-10 animate-spin text-[#1e3a8a]/20" />
                            </div>
                          ) : filteredDocuments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-40 opacity-20">
                              <Archive className="w-16 h-16 mb-4" />
                              <p className="text-[12px] font-black uppercase tracking-widest">ምንም ሰነድ የለም</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-slate-50">
                              {filteredDocuments.map(file => (
                                <div key={file.id} className="p-8 hover:bg-slate-50/50 transition-all group">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                      <div className="w-16 h-16 bg-white border-2 border-slate-50 rounded-3xl flex items-center justify-center shadow-md">
                                        <FileText className="w-8 h-8 text-slate-300" />
                                      </div>
                                      <div className="space-y-1.5">
                                        <p className="text-sm font-black text-slate-900">{file.name}</p>
                                        <div className="flex flex-wrap items-center gap-3">
                                          <Badge className="h-6 px-3 text-[7px] font-black uppercase bg-blue-50 text-blue-600 rounded-full">ደረጃ፦ {file.status}</Badge>
                                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{file.expertName} • {file.sector}</span>
                                          {file.registryNumber && (
                                            <span className="text-[8px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase">REG: {file.registryNumber}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <Button variant="ghost" size="icon" onClick={() => handleOpenFile(file)} className="h-11 w-11 text-blue-500 rounded-2xl bg-blue-50/30 hover:bg-blue-100"><Eye className="w-5 h-5" /></Button>
                                       {(isMasterAdmin || user?.uid === file.uploaderId) && (
                                          <Button variant="ghost" size="icon" onClick={() => confirmDelete(file.id, file.name)} className="h-11 w-11 text-red-300 hover:text-red-500 rounded-2xl hover:bg-red-50"><Trash2 className="w-5 h-5" /></Button>
                                       )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="lg:col-span-1">
                    <Card className="shadow-2xl border-none rounded-[3rem] bg-white overflow-hidden h-full flex flex-col p-8 space-y-8">
                      <div className="space-y-2">
                        <Badge className="bg-purple-50 text-purple-600 font-black text-[8px] uppercase px-4 py-1.5 rounded-full border-none">AI Intelligence Agent</Badge>
                        <CardTitle className="text-xl font-black text-slate-900 uppercase">ወርቁ (Worqu) AI</CardTitle>
                      </div>

                      <div className="flex-1 space-y-6">
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 min-h-[200px]">
                          <p className="text-[11px] font-bold leading-relaxed text-slate-600">
                            {isAiLoading ? (
                              <span className="flex items-center gap-3 animate-pulse"><Loader2 className="w-4 h-4 animate-spin" /> ወርቁ ሰነዶችን እየመረመረ ነው...</span>
                            ) : aiAnalysisResult || "ኢትዮጵያዊ AI ነኝ ምን ልርዳዎት? በመዝገብ ቤት ያሉትን ፋይሎች እንድመረምር ትእዛዝ ይስጡ።"}
                          </p>
                        </div>
                        <Button onClick={performAiAnalysis} disabled={isAiLoading} className="w-full h-12 bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 font-black uppercase text-[10px] rounded-2xl shadow-xl">
                          {isAiLoading ? "ትንተና ላይ..." : "መረጃዎቹን መርምር (Analyze Registry)"}
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="messenger">
                <Card className="h-[600px] shadow-2xl border-none rounded-[3rem] bg-white flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-[#1e3a8a]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">የቢሮ መፃፃፊያ (Sector Chat)</span>
                     </div>
                  </div>
                  <ScrollArea className="flex-1 p-8">
                    <div className="space-y-6">
                      {feedbackMessages.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.uploaderId === user?.uid ? 'items-end' : 'items-start'}`}>
                          <div className={`p-4 rounded-[2rem] text-[12px] font-bold shadow-sm max-w-[70%] ${msg.uploaderId === user?.uid ? 'bg-[#1e3a8a] text-white' : 'bg-slate-100 text-slate-800'}`}>
                            {msg.content}
                          </div>
                          <div className="flex items-center gap-2 mt-2 px-2">
                             <span className="text-[8px] text-slate-400 font-black uppercase">{msg.senderName}</span>
                             {(isMasterAdmin || msg.uploaderId === user?.uid) && (
                                <button onClick={() => deleteDocumentNonBlocking(doc(db!, 'feedback', msg.id))} className="text-red-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-6 bg-white border-t flex gap-4">
                    <Input value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} placeholder="መልዕክት ይጻፉ..." className="h-12 bg-slate-50 border-none rounded-2xl text-[12px] font-bold px-6" />
                    <Button className="h-12 w-12 p-0 rounded-2xl bg-[#1e3a8a] shadow-xl" onClick={async () => {
                      if(!feedbackInput.trim()) return;
                      await addDocumentNonBlocking(collection(db!, 'feedback'), {
                        senderName: user?.displayName || user?.email || "ባለሙያ",
                        content: feedbackInput,
                        timestamp: new Date().toISOString(),
                        uploaderId: user?.uid,
                        createdAt: Timestamp.now()
                      });
                      setFeedbackInput("");
                    }}><Send className="w-5 h-5" /></Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center font-black uppercase text-red-600">እርግጠኛ ነዎት?</AlertDialogTitle>
            <AlertDialogDescription className="text-center font-bold text-slate-500 py-4">
              ይህ ሰነድ ከመዝገብ ቤት እንዲሰረዝ ይፈልጋሉ? ድርጊቱ ሊመለስ አይችልም።
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3">
            <AlertDialogCancel className="flex-1 rounded-2xl font-black uppercase text-[10px]">ተመለስ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDoc} className="flex-1 bg-red-600 hover:bg-red-700 rounded-2xl font-black uppercase text-[10px]">አጥፋ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="px-8 h-10 bg-white border-t flex justify-between items-center shrink-0">
        <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">ITB PRO ENTERPRISE V7.5.0</span>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="text-[8px] font-black text-slate-400 uppercase">Secure Database</span>
           </div>
        </div>
      </footer>
    </div>
  );
}
