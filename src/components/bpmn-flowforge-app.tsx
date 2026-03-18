
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
  SearchCode
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
  useAuth,
  updateDocumentNonBlocking
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
      f.status?.toLowerCase().includes(q)
    );
  }, [uploadedFiles, globalSearch]);

  const handleLogAction = async (action: string, docName: string, details: string) => {
    if (!db || !user) return;
    await addDocumentNonBlocking(collection(db, 'audit_logs'), {
      action,
      userName: user.displayName || user.email || "ባለሙያ",
      docName,
      details,
      timestamp: Timestamp.now()
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
      await addDocumentNonBlocking(collection(db, 'documents'), {
        name: finalName,
        category: "ኦፊሴላዊ ሰነድ",
        fileName: selectedFile ? selectedFile.name : finalName,
        fileSize: selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "N/A",
        uploadDate: new Date().toISOString(),
        fileUrl: fileUrl,
        status: 'በሂደት ላይ',
        uploaderId: user.uid,
        expertName: user.displayName || user.email || "ባለሙያ",
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

  const handleWorkflowSignature = async (file: UploadedFile, nextStatus: string, role: string) => {
    if (!db || !user) return;
    
    const newSignature: SignatureEntry = {
      role,
      name: user.displayName || user.email || "ባለሙያ",
      date: new Date().toLocaleString('et-ET'),
      status: 'ተፈርሟል'
    };

    const updatedSignatures = [...(file.signatures || []), newSignature];

    await updateDocumentNonBlocking(doc(db, 'documents', file.id), {
      status: nextStatus,
      signatures: updatedSignatures
    });

    handleLogAction("SIGNATURE", file.name, `${role} ፊርማቸውን አኑረዋል - ደረጃው ወደ "${nextStatus}" ተቀይሯል`);
    toast({ title: "ተፈርሟል", description: `ሰነዱ በ${role} ተፈርሞ ወደ "${nextStatus}" ደረጃ ተቀይሯል` });
  };

  const performAiAnalysis = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      const docCount = uploadedFiles.length;
      const approvedCount = uploadedFiles.filter(f => f.status === 'በዳይሬክተር የጸደቀ' || f.status === 'የተጠናቀቀ').length;
      const result = `ኢትዮጵያዊ AI ነኝ ምን ልርዳዎት?

በመዝገብ ቤትዎ ውስጥ ${docCount} ሰነዶችን ተመልክቻለሁ። 
ከእነዚህ ውስጥ ${approvedCount} ሰነዶች ሙሉ በሙሉ ተረጋግጠው ጸድቀዋል።

ትኩረት የሚሹ ጉዳዮች፦
1. በመጠባበቅ ላይ ያሉ ${docCount - approvedCount} ሰነዶች አሉ።
2. በቅርቡ የተመዘገቡ ${uploadedFiles.slice(0, 3).map(f => `"${f.name}"`).join(', ')} የተሰኙ ፋይሎች ትንተና ይፈልጋሉ።

ምን ተጨማሪ መረጃ ልስጥዎ?`;
      setAiAnalysisResult(result);
      setIsAiLoading(false);
    }, 1500);
  };

  const automatedAnalysis = useMemo(() => {
    const totalDocs = uploadedFiles.length;
    let efficiency = Math.min(99, 82 + (totalDocs * 0.3));
    const graphData = uploadedFiles.length > 0 
      ? uploadedFiles.slice(0, 7).reverse().map((doc, idx) => ({
          name: doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'}) : `P${idx}`,
          activity: 70 + (idx * 5) + Math.floor(Math.random() * 5)
        }))
      : [{ name: 'Jan', activity: 80 }, { name: 'Feb', activity: 85 }, { name: 'Mar', activity: 90 }];

    return { totalDocs, efficiency, graphData };
  }, [uploadedFiles]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="bg-white border-b px-6 py-4 shrink-0 shadow-sm z-50">
        <div className="flex flex-col items-center mx-auto text-center">
          <span className="text-[14px] font-black text-[#1e3a8a] uppercase tracking-tight mb-2">የኢኖቬሽንና ቴክኖሎጂ ቢሮ</span>
          <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center shadow-md border-2 border-white overflow-hidden">
             <div className="text-white text-[10px] font-black">ITB</div>
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
            {/* BPMN Architect Card */}
            <Card className="shadow-xl border-none rounded-[2rem] bg-white overflow-hidden">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><BrainCircuit className="w-4 h-4 text-[#1e3a8a]" /></div>
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">BPMN ካርታ ዝግጅት (Architect)</h2>
                  </div>
                  {xmlResult && (
                    <Button onClick={saveDiagramToVault} variant="outline" className="h-9 rounded-xl text-[9px] font-black uppercase border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white transition-all">
                      <Save className="w-3.5 h-3.5 mr-2" /> ዲያግራም መዝግብ (Save to Vault)
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="የአገልግሎት ስም (Title)..." className="h-11 rounded-xl bg-slate-50 border-none font-bold text-[11px]" />
                  <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="የሥራ ሂደቱን ዝርዝር እዚህ ይጻፉ (Steps)..." className="min-h-[100px] rounded-xl bg-slate-50 border-none text-[11px] font-medium leading-relaxed resize-none p-4" />
                  <Button className="w-full h-11 bg-[#1e3a8a] rounded-xl font-black text-[10px] shadow-lg uppercase" onClick={() => {
                    const res = generateBPMN(input, title);
                    if(res) { setXmlResult(res); setActiveTab("diagram"); }
                  }}>ካርታውን አሳይ (Build Diagram)</Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Vault Section */}
              <div className="lg:col-span-2">
                <Card className="shadow-xl border-none rounded-[2rem] bg-white overflow-hidden h-full">
                  <CardHeader className="p-6 flex flex-row items-center justify-between border-b border-slate-50">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Files className="w-4 h-4" /> መዝገብ ቤት (Vault & Workflow)
                    </CardTitle>
                    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                      <DialogTrigger asChild>
                        <Button className="h-10 px-4 rounded-xl bg-[#1e3a8a] font-black uppercase text-[9px] shadow-md">
                          <Upload className="w-3.5 h-3.5 mr-1.5" /> ፋይል መዝግብ
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm rounded-[1.5rem] p-6 border-none">
                        <DialogHeader><DialogTitle className="font-black text-sm text-[#1e3a8a] text-center mb-4 uppercase">የሰነድ መመዝገቢያ</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="h-10 rounded-xl bg-slate-50 border-none text-[9px] pt-2" />
                          <Input value={upName} onChange={(e) => setUpName(e.target.value)} placeholder="የሰነዱ ስም..." className="h-10 rounded-xl bg-slate-50 border-none text-[10px] font-bold" />
                          <Button className="w-full h-11 bg-[#1e3a8a] rounded-xl font-black uppercase text-[10px] mt-2 shadow-lg" onClick={handleFileUpload} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "መዝግብ"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                      {isDocsLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-[#1e3a8a]/20" />
                        </div>
                      ) : filteredDocuments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-20">
                          <Archive className="w-12 h-12 mb-2" />
                          <p className="text-[10px] font-black uppercase">ምንም ሰነድ የለም</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-50">
                          {filteredDocuments.map(file => (
                            <div key={file.id} className="p-6 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-white border rounded-2xl flex items-center justify-center shadow-sm">
                                    <FileText className="w-6 h-6 text-slate-300" />
                                  </div>
                                  <div className="flex flex-col">
                                    <p className="text-[11px] font-black text-slate-900">{file.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="ghost" className="h-5 px-2 text-[7px] font-black uppercase bg-blue-50 text-blue-600">ደረጃ፦ {file.status}</Badge>
                                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{file.expertName}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                   <Button variant="ghost" size="icon" onClick={() => handleOpenFile(file)} className="h-9 w-9 text-blue-500 rounded-xl bg-blue-50/50 hover:bg-blue-100"><Eye className="w-4 h-4" /></Button>
                                   
                                   {/* Contextual Workflow Action Button */}
                                   {file.status === 'በሂደት ላይ' && (
                                      <Button onClick={() => handleWorkflowSignature(file, 'በኃላፊ የተፈረመ', 'ቢሮ ኃላፊ')} size="sm" className="h-9 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 font-black uppercase text-[8px] text-white">
                                        <Stamp className="w-3.5 h-3.5 mr-1.5" /> ኃላፊ ይፈርሙ
                                      </Button>
                                   )}
                                   {file.status === 'በኃላፊ የተፈረመ' && (
                                      <Button onClick={() => handleWorkflowSignature(file, 'በዳይሬክተር የጸደቀ', 'ዳይሬክተር')} size="sm" className="h-9 px-4 rounded-xl bg-green-600 hover:bg-green-700 font-black uppercase text-[8px] text-white">
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> ዳይሬክተር ያጽድቁ
                                      </Button>
                                   )}

                                   {isAdmin && (
                                      <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db!, 'documents', file.id))} className="h-9 w-9 text-red-300 hover:text-red-500 rounded-xl"><Trash2 className="w-4 h-4" /></Button>
                                   )}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-50">
                                {['ቢሮ ኃላፊ', 'ዳይሬክተር', 'ቡድን መሪ', 'ባለሙያ'].map((role) => {
                                  const sig = file.signatures?.find(s => s.role === role);
                                  return (
                                    <div key={role} className="flex flex-col items-center gap-1.5 group">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                                        sig ? 'bg-green-50 border-green-200 text-green-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-300'
                                      }`}>
                                        {sig ? <CheckCircle2 className="w-4 h-4" /> : <PenTool className="w-3.5 h-3.5" />}
                                      </div>
                                      <span className={`text-[6px] font-black uppercase text-center transition-colors ${
                                        sig ? 'text-green-600' : 'text-slate-400'
                                      }`}>{role}</span>
                                      {sig && (
                                        <span className="text-[5px] font-bold text-slate-400 hidden group-hover:block">{sig.name.split(' ')[0]}</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* AI Insight Section */}
              <div className="lg:col-span-1">
                <Card className="shadow-xl border-none rounded-[2rem] bg-[#1e3a8a] text-white overflow-hidden h-full flex flex-col">
                  <CardHeader className="p-6">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> የ AI ረዳት ትንተና
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="p-4 bg-white/10 rounded-[1.5rem] border border-white/10">
                        <p className="text-[11px] font-bold leading-relaxed">
                          {isAiLoading ? (
                            <span className="flex items-center gap-2 italic text-blue-100"><Loader2 className="w-3 h-3 animate-spin" /> ወርቁ መረጃዎችን እያጤነ ነው...</span>
                          ) : aiAnalysisResult || "ኢትዮጵያዊ AI ነኝ ምን ልርዳዎት? የቢሮዎን ፋይሎች እንድመረምር ትእዛዝ ይስጡ።"}
                        </p>
                      </div>
                      <Button onClick={performAiAnalysis} disabled={isAiLoading} className="w-full h-11 bg-white text-[#1e3a8a] hover:bg-blue-50 font-black uppercase text-[10px] rounded-xl shadow-xl">
                        {isAiLoading ? "ትንተና ላይ..." : "መረጃዎቹን መርምር (Analyze Files)"}
                      </Button>
                    </div>

                    <div className="mt-8">
                       <p className="text-[9px] font-black uppercase text-blue-200 mb-4 tracking-widest">አውቶማቲክ አፈጻጸም</p>
                       <div className="h-[120px] w-full bg-white/5 rounded-2xl p-2">
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={automatedAnalysis.graphData}>
                                <Area type="monotone" dataKey="activity" stroke="#fff" fill="#fff" fillOpacity={0.1} />
                             </AreaChart>
                          </ResponsiveContainer>
                       </div>
                       <div className="mt-4 flex items-center justify-between px-2">
                          <span className="text-[8px] font-black uppercase">ውጤታማነት</span>
                          <span className="text-xl font-black">{automatedAnalysis.efficiency.toFixed(0)}%</span>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <div className="flex justify-center">
                <TabsList className="bg-white p-1 rounded-xl shadow-lg border border-slate-50 h-auto gap-1">
                  <TabsTrigger value="diagram" className="text-[9px] font-black px-6 py-2 rounded-lg uppercase">የካሙንዳ ዲያግራም ኤዲተር</TabsTrigger>
                  <TabsTrigger value="messenger" className="text-[9px] font-black px-6 py-2 rounded-lg uppercase">የቢሮ መፃፃፊያ</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="diagram">
                <Card className="min-h-[600px] rounded-[2rem] border-none shadow-xl overflow-hidden bg-white relative">
                  {xmlResult ? <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} /> : (
                    <div className="h-full min-h-[600px] flex flex-col items-center justify-center opacity-5">
                      <SearchCode className="w-16 h-16" />
                      <p className="text-[12px] font-black uppercase mt-2">BPMN ካርታ የለም</p>
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="messenger">
                <Card className="h-[400px] shadow-xl border-none rounded-[2rem] bg-white flex flex-col overflow-hidden">
                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-4">
                      {feedbackMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 mt-20">
                           <MessageSquare className="w-10 h-10" />
                           <p className="text-[9px] font-black uppercase mt-2">መልዕክት የለም</p>
                        </div>
                      ) : feedbackMessages.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.uploaderId === user?.uid ? 'items-end' : 'items-start'}`}>
                          <div className={`p-3 rounded-2xl text-[11px] font-bold ${msg.uploaderId === user?.uid ? 'bg-[#1e3a8a] text-white shadow-md' : 'bg-slate-100 text-slate-800'}`}>
                            {msg.content}
                          </div>
                          <span className="text-[7px] text-slate-400 font-black uppercase mt-1 px-1">{msg.senderName}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-4 bg-white border-t flex gap-3">
                    <Input value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} placeholder="መልዕክት ይጻፉ..." className="h-11 bg-slate-50 border-none rounded-xl text-[11px] font-bold" />
                    <Button className="h-11 w-11 p-0 rounded-xl bg-[#1e3a8a] shadow-lg" onClick={async () => {
                      if(!feedbackInput.trim()) return;
                      await addDocumentNonBlocking(collection(db!, 'feedback'), {
                        senderName: user?.displayName || user?.email || "ባለሙያ",
                        content: feedbackInput,
                        timestamp: new Date().toISOString(),
                        uploaderId: user?.uid,
                        createdAt: Timestamp.now()
                      });
                      setFeedbackInput("");
                    }}><Send className="w-4 h-4" /></Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>

      <footer className="px-6 h-8 bg-white border-t flex justify-between items-center shrink-0">
        <span className="text-[7px] font-black text-slate-300 uppercase">ITB PRO ENTERPRISE V5.8.0</span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-full">
          <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[7px] font-black text-green-600 uppercase">SECURE NETWORK</span>
        </div>
      </footer>
    </div>
  );
}
