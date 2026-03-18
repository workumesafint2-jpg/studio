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
  Archive
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
  signedBy?: string;
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
      f.expertName?.toLowerCase().includes(q)
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
      toast({ title: "መረጃ ይጎድላል", description: "እባክዎ ፋይል ይምረጡ", variant: "destructive" });
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
        category: "ሪፖርት",
        fileName: selectedFile ? selectedFile.name : finalName,
        fileSize: selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "N/A",
        uploadDate: new Date().toISOString(),
        fileUrl: fileUrl,
        type: selectedFile ? selectedFile.type : 'institutional/record',
        status: 'በሂደት ላይ',
        uploaderId: user.uid,
        expertName: upExpertName || user.displayName || "ባለሙያ",
        sector: upSector || "አጠቃላይ",
        createdAt: Timestamp.now()
      });
      handleLogAction("UPLOAD", finalName, "አዲስ ሰነድ መዝግበዋል");
      setIsSaving(false);
      setIsUploadOpen(false);
      toast({ title: "ተሳክቷል", description: "ሰነዱ በመዝገብ ቤት ገብቷል።" });
    } catch (e) {
      setIsSaving(false);
      toast({ title: "ስህተት", description: "መጫን አልተቻለም።", variant: "destructive" });
    }
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
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center w-full p-2 rounded-xl font-bold text-[10px] hover:bg-blue-50">
                    <ShieldCheck className="w-3.5 h-3.5 mr-2 text-blue-600" /> የአስተዳዳሪ ገጽ
                  </Link>
                </DropdownMenuItem>
              )}
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
            placeholder="መዝገብ ቤት ፈትሽ..." 
            className="h-11 w-full pl-11 pr-4 rounded-full border-none shadow-lg bg-white text-[11px] font-bold"
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
                </div>
                <div className="space-y-3">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="የአገልግሎት ስም..." className="h-11 rounded-xl bg-slate-50 border-none font-bold text-[11px]" />
                  <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="ዝርዝር ተግባራት..." className="min-h-[100px] rounded-xl bg-slate-50 border-none text-[11px] font-medium leading-relaxed resize-none p-4" />
                  <Button className="w-full h-11 bg-[#1e3a8a] rounded-xl font-black text-[10px] shadow-lg uppercase" onClick={() => {
                    const res = generateBPMN(input, title);
                    if(res) { setXmlResult(res); setActiveTab("diagram"); }
                  }}>ካርታውን አሳይ</Button>
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
                  <DialogContent className="max-w-sm rounded-[1.5rem] p-6 border-none">
                    <DialogHeader><DialogTitle className="font-black text-sm text-[#1e3a8a] text-center mb-4 uppercase">የሰነድ መመዝገቢያ</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="h-10 rounded-xl bg-slate-50 border-none text-[9px] pt-2" />
                      <Input value={upName} onChange={(e) => setUpName(e.target.value)} placeholder="የሰነዱ ስም..." className="h-10 rounded-xl bg-slate-50 border-none text-[10px] font-bold" />
                      <Input value={upSector} onChange={(e) => setUpSector(e.target.value)} placeholder="ዘርፍ (Sector)..." className="h-10 rounded-xl bg-slate-50 border-none text-[10px] font-bold" />
                      <Button className="w-full h-11 bg-[#1e3a8a] rounded-xl font-black uppercase text-[10px] mt-2 shadow-lg" onClick={handleFileUpload} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "አጽድቅና መዝግብ"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  {isDocsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-[#1e3a8a]/20" />
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {filteredDocuments.map(file => (
                        <div key={file.id} className="p-5 hover:bg-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <FileText className="w-5 h-5 text-slate-400" />
                            <div className="flex flex-col">
                              <p className="text-[11px] font-black text-slate-900">{file.name}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{file.expertName} • {file.status}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <Button variant="ghost" size="icon" onClick={() => handleOpenFile(file)} className="h-8 w-8 text-blue-500"><Eye className="w-4 h-4" /></Button>
                             {isAdmin && (
                                <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db!, 'documents', file.id))} className="h-8 w-8 text-red-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
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
                  <TabsTrigger value="diagram" className="text-[9px] font-black px-6 py-2 rounded-lg uppercase">ዲያግራም</TabsTrigger>
                  <TabsTrigger value="dashboard" className="text-[9px] font-black px-6 py-2 rounded-lg uppercase">አፈጻጸም</TabsTrigger>
                  <TabsTrigger value="messenger" className="text-[9px] font-black px-6 py-2 rounded-lg uppercase">መፃፃፊያ</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="diagram">
                <Card className="min-h-[500px] rounded-[2rem] border-none shadow-xl overflow-hidden bg-white relative">
                  {xmlResult ? <BPMNViewer xml={xmlResult} title={title} ref={viewerRef} /> : (
                    <div className="h-full min-h-[500px] flex flex-col items-center justify-center opacity-5">
                      <FileText className="w-12 h-12" />
                      <p className="text-[12px] font-black uppercase mt-2">BPMN ካርታ የለም</p>
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="dashboard">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="shadow-xl border-none rounded-[2rem] bg-white p-6">
                       <h3 className="text-[9px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-slate-400"><TrendingUp className="w-4 h-4" /> ቢሮ እንቅስቃሴ</h3>
                       <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={automatedAnalysis.graphData}>
                                <XAxis dataKey="name" fontSize={8} />
                                <YAxis fontSize={8} />
                                <RechartsTooltip />
                                <Area type="monotone" dataKey="activity" stroke="#1e3a8a" fill="#1e3a8a" fillOpacity={0.1} />
                             </AreaChart>
                          </ResponsiveContainer>
                       </div>
                    </Card>
                    <Card className="shadow-xl border-none rounded-[2rem] bg-white p-6 flex flex-col justify-center text-center">
                       <p className="text-[8px] font-black text-slate-400 uppercase mb-2">ውጤታማነት</p>
                       <p className="text-4xl font-black text-[#1e3a8a]">{automatedAnalysis.efficiency.toFixed(1)}%</p>
                       <p className="text-[10px] font-bold text-slate-500 mt-4 uppercase tracking-widest">{automatedAnalysis.totalDocs} ሰነዶች ተመዝግበዋል</p>
                    </Card>
                 </div>
              </TabsContent>

              <TabsContent value="messenger">
                <Card className="h-[400px] shadow-xl border-none rounded-[2rem] bg-white flex flex-col overflow-hidden">
                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-4">
                      {feedbackMessages.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.uploaderId === user?.uid ? 'items-end' : 'items-start'}`}>
                          <div className={`p-3 rounded-2xl text-[11px] font-bold ${msg.uploaderId === user?.uid ? 'bg-[#1e3a8a] text-white' : 'bg-slate-100 text-slate-800'}`}>
                            {msg.content}
                          </div>
                          <span className="text-[7px] text-slate-400 font-black uppercase mt-1">{msg.senderName}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-4 bg-white border-t flex gap-3">
                    <Input value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} placeholder="መልዕክት ይጻፉ..." className="h-11 bg-slate-50 border-none rounded-xl text-[11px] font-bold" />
                    <Button className="h-11 w-11 p-0 rounded-xl bg-[#1e3a8a]" onClick={async () => {
                      if(!feedbackInput.trim()) return;
                      await addDocumentNonBlocking(collection(db!, 'feedback'), {
                        senderName: user?.displayName || "ባለሙያ",
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
        <span className="text-[7px] font-black text-slate-300 uppercase">ITB ENTERPRISE V5.5.0</span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-full">
          <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[7px] font-black text-green-600 uppercase">SECURE NETWORK</span>
        </div>
      </footer>
    </div>
  );
}