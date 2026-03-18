'use client';

import { useMemo, useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Users, 
  Clock, 
  CheckCircle2, 
  Eye, 
  Building2, 
  User,
  MoreVertical,
  Download,
  Trash2,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  FileSearch,
  History,
  PenTool,
  Archive,
  Search
} from 'lucide-react';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useUser,
  addDocumentNonBlocking
} from '@/firebase';
import { collection, query, orderBy, doc, Timestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ADMIN_EMAIL = "workumesafint2@gmail.com";

interface AuditLog {
  id: string;
  action: string;
  userName: string;
  docName: string;
  timestamp: any;
  details: string;
}

interface DocumentRecord {
  id: string;
  name: string;
  category: string;
  status: string;
  uploadDate: string;
  fileUrl: string;
  uploaderId: string;
  uploaderName?: string;
  sector?: string;
  expertName?: string;
  createdAt?: any;
  fileName?: string;
  signedBy?: string;
  signedAt?: string;
}

export default function AdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("documents");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isMasterAdmin = user?.email === ADMIN_EMAIL;

  const docsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
  }, [db]);

  const auditQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
  }, [db]);

  const { data: allDocs, isLoading: docsLoading } = useCollection<DocumentRecord>(docsQuery);
  const { data: allLogs, isLoading: logsLoading } = useCollection<AuditLog>(auditQuery);

  const stats = useMemo(() => ({
    totalDocs: allDocs?.length || 0,
    approvedCount: allDocs?.filter(d => d.status.includes('የጸደቀ') || d.status === 'ፊርማ ያረፈበት').length || 0,
    signedCount: allDocs?.filter(d => d.status === 'ፊርማ ያረፈበት').length || 0,
    archivedCount: allDocs?.filter(d => d.status === 'በመዝገብ ቤት የሰፈረ').length || 0
  }), [allDocs]);

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

  const handleApprove = (docItem: DocumentRecord) => {
    if (!db || !isMasterAdmin) return;
    updateDocumentNonBlocking(doc(db, 'documents', docItem.id), { status: 'በዳይሬክተር የጸደቀ' });
    handleLogAction("APPROVE", docItem.name, "በዳይሬክተር የጸደቀ");
    toast({ title: "ጸድቋል", description: "ሰነዱ በዳይሬክተር በትክክል ጸድቋል" });
  };

  const handleSign = (docItem: DocumentRecord) => {
    if (!db || !isMasterAdmin) return;
    updateDocumentNonBlocking(doc(db, 'documents', docItem.id), { 
      status: 'ፊርማ ያረፈበት',
      signedBy: user?.displayName || "ዳይሬክተር",
      signedAt: new Date().toISOString()
    });
    handleLogAction("SIGN", docItem.name, "ዲጂታል ፊርማ አርፎበታል");
    toast({ title: "ፊርማ አርፏል", description: "ዲጂታል ፊርማው በትክክል ተቀምጧል" });
  };

  const handleArchive = (docItem: DocumentRecord) => {
    if (!db || !isMasterAdmin) return;
    updateDocumentNonBlocking(doc(db, 'documents', docItem.id), { status: 'በመዝገብ ቤት የሰፈረ' });
    handleLogAction("ARCHIVE", docItem.name, "ወደ መዝገብ ቤት ተልኳል");
    toast({ title: "አርካይቭ ተደርጓል", description: "ሰነዱ ወደ መዝገብ ቤት ተላልፏል" });
  };

  const handleDelete = (docItem: DocumentRecord) => {
    if (!db) return;
    if (isMasterAdmin || user?.uid === docItem.uploaderId) {
      deleteDocumentNonBlocking(doc(db, 'documents', docItem.id));
      handleLogAction("DELETE", docItem.name, "ሰነዱ ተሰርዟል");
      toast({ title: "ተሰርዟል", description: "ሰነዱ ከመዝገብ ቤት ተወግዷል" });
    }
  };

  const handleOpenFile = (docItem: DocumentRecord) => {
    if (!docItem.fileUrl) return;
    handleLogAction("VIEW", docItem.name, "ሰነዱን ተመልክተዋል");
    const win = window.open();
    if (win) {
      if (docItem.fileUrl.startsWith('data:')) {
        win.document.write(`<iframe src="${docItem.fileUrl}" frameborder="0" style="border:0; width:100%; height:100%;" allowfullscreen></iframe>`);
      } else {
        win.location.href = docItem.fileUrl;
      }
    }
  };

  if (!mounted) return null;

  return (
    <AuthGuard>
      <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <Button asChild variant="ghost" className="rounded-2xl text-slate-500 hover:text-[#1e3a8a] font-black text-[10px] uppercase h-12 px-6">
            <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> ወደ ዋናው ገጽ</Link>
          </Button>
          <header className="flex flex-col items-center">
            <h1 className="text-[14px] font-black text-[#1e3a8a] uppercase tracking-tight mb-2">የኢኖቬሽንና ቴክኖሎጂ ቢሮ</h1>
            <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center shadow-md border-2 border-white overflow-hidden mb-2">
               <div className="text-white text-[10px] font-black">ITB</div>
            </div>
            <h1 className="text-xs font-black text-slate-800 uppercase bg-white px-10 py-3 rounded-full shadow-lg border flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-green-500" /> የቢሮ መቆጣጠሪያ ማዕከል
            </h1>
          </header>
          <div className="w-32 flex justify-end">
            {isMasterAdmin && <Badge className="bg-green-500 text-white font-black text-[8px] h-8 px-4 rounded-xl uppercase">Master Admin Access</Badge>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="ጠቅላላ ሰነዶች" value={stats.totalDocs.toString()} icon={<FileText className="w-5 h-5 text-blue-600" />} />
          <StatCard title="የጸደቁ" value={stats.approvedCount.toString()} icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} />
          <StatCard title="ፊርማ ያረፈባቸው" value={stats.signedCount.toString()} icon={<PenTool className="w-5 h-5 text-purple-600" />} />
          <StatCard title="አርካይቭ የሆኑ" value={stats.archivedCount.toString()} icon={<Archive className="w-5 h-5 text-amber-600" />} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="bg-white p-1 rounded-2xl shadow-xl border border-slate-100 h-auto gap-1">
              <TabsTrigger value="documents" className="text-[10px] font-black px-8 py-3 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">የሰነዶች ቁጥጥር</TabsTrigger>
              <TabsTrigger value="audit" className="text-[10px] font-black px-8 py-3 rounded-xl uppercase data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">የክትትል መዝገብ (Audit)</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="documents">
            <Card className="shadow-2xl border-none overflow-hidden rounded-[2.5rem] bg-white">
              <CardHeader className="bg-white border-b border-slate-50 py-8 px-10 flex flex-row items-center justify-between">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                  <FileSearch className="w-5 h-5" /> የተቋም መዝገብ ቤት ቁጥጥር
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {docsLoading ? (
                  <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <Loader2 className="w-12 h-12 animate-spin text-[#1e3a8a]/20" />
                    <p className="text-[10px] font-black text-slate-300 uppercase">መረጃዎችን በመጫን ላይ...</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {allDocs?.map((docItem) => (
                      <div key={docItem.id} className="flex items-center justify-between p-8 hover:bg-slate-50/80 transition-all group">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-white border rounded-2xl flex items-center justify-center shadow-md">
                            <FileText className="w-7 h-7 text-slate-400 group-hover:text-[#1e3a8a]" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-sm font-black text-slate-900">{docItem.name}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] text-[#1e3a8a] font-black flex items-center gap-2">
                                <User className="w-3.5 h-3.5" /> {docItem.expertName || "ባለሙያ"}
                              </span>
                              <Badge variant="outline" className={`text-[8px] font-black uppercase rounded-full ${docItem.status.includes('የጸደቀ') ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                {docItem.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Button variant="outline" size="sm" onClick={() => handleOpenFile(docItem)} className="h-11 px-6 text-[10px] font-black rounded-xl border-slate-200 shadow-sm hover:bg-[#1e3a8a] hover:text-white">
                            <Eye className="w-4 h-4 mr-2" /> ክፈት
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-11 w-11 hover:bg-slate-100 rounded-xl">
                                <MoreVertical className="w-5 h-5 text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 p-3 rounded-[2rem] shadow-2xl border-none">
                              <DropdownMenuLabel className="text-[9px] uppercase text-slate-400 px-4 py-3 font-black">ተግባራት</DropdownMenuLabel>
                              {isMasterAdmin && (
                                <>
                                  {docItem.status === 'በሂደት ላይ' && (
                                    <DropdownMenuItem onClick={() => handleApprove(docItem)} className="text-[11px] font-black cursor-pointer bg-green-50 text-green-700 hover:bg-green-100 rounded-2xl mb-2 p-4">
                                      <CheckCircle2 className="w-4 h-4 mr-2" /> ዳይሬክተር አፅድቅ
                                    </DropdownMenuItem>
                                  )}
                                  {docItem.status === 'በዳይሬክተር የጸደቀ' && (
                                    <DropdownMenuItem onClick={() => handleSign(docItem)} className="text-[11px] font-black cursor-pointer bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-2xl mb-2 p-4">
                                      <PenTool className="w-4 h-4 mr-2" /> ዲጂታል ፊርማ አኑር
                                    </DropdownMenuItem>
                                  )}
                                  {docItem.status === 'ፊርማ ያረፈበት' && (
                                    <DropdownMenuItem onClick={() => handleArchive(docItem)} className="text-[11px] font-black cursor-pointer bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-2xl mb-2 p-4">
                                      <Archive className="w-4 h-4 mr-2" /> ወደ መዝገብ ቤት ላክ
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                              <DropdownMenuItem asChild className="text-[11px] font-black cursor-pointer rounded-2xl p-4 hover:bg-slate-50 mb-2">
                                <a href={docItem.fileUrl} download={docItem.fileName} className="flex items-center w-full">
                                  <Download className="w-4 h-4 mr-2 text-[#1e3a8a]" /> አውርድ
                                </a>
                              </DropdownMenuItem>
                              {(isMasterAdmin || user?.uid === docItem.uploaderId) && (
                                <DropdownMenuItem onClick={() => handleDelete(docItem)} className="text-[11px] font-black cursor-pointer text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl p-4">
                                  <Trash2 className="w-4 h-4 mr-2" /> ሰርዝ
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card className="shadow-2xl border-none overflow-hidden rounded-[2.5rem] bg-white">
              <CardHeader className="bg-white border-b border-slate-50 py-8 px-10">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                  <History className="w-5 h-5" /> የክትትልና ቁጥጥር መዝገብ (Audit Log)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {logsLoading ? (
                  <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <Loader2 className="w-12 h-12 animate-spin text-[#1e3a8a]/20" />
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {allLogs?.map((log) => (
                      <div key={log.id} className="p-6 hover:bg-slate-50 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                            log.action === 'DELETE' ? 'bg-red-50 text-red-500' : 
                            log.action === 'APPROVE' ? 'bg-green-50 text-green-500' :
                            log.action === 'SIGN' ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'
                          }`}>
                            {log.action === 'VIEW' ? <Eye className="w-5 h-5" /> :
                             log.action === 'DELETE' ? <Trash2 className="w-5 h-5" /> :
                             log.action === 'SIGN' ? <PenTool className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-800">{log.userName} {log.details}</span>
                            <span className="text-[9px] font-bold text-[#1e3a8a] uppercase">{log.docName}</span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <Badge variant="ghost" className="text-[8px] font-black uppercase text-slate-400">{log.action}</Badge>
                          <span className="text-[9px] font-bold text-slate-400">
                            {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <Card className="border-none shadow-xl bg-white overflow-hidden rounded-2xl">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-xl font-black text-slate-900">{value}</h3>
        </div>
        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center shadow-inner">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}