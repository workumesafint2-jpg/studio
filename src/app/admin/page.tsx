'use client';

import { useMemo, useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Activity, 
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
  TrendingUp,
  FileSearch
} from 'lucide-react';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useUser
} from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
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

const ADMIN_EMAIL = "workumesafint2@gmail.com";

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
}

export default function AdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isMasterAdmin = user?.email === ADMIN_EMAIL;

  const docsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
  }, [db]);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'));
  }, [db]);

  const { data: allDocs, isLoading: docsLoading } = useCollection<DocumentRecord>(docsQuery);
  const { data: allUsers, isLoading: usersLoading } = useCollection<any>(usersQuery);

  const stats = useMemo(() => ({
    totalDocs: allDocs?.length || 0,
    totalUsers: allUsers?.length || 0,
    status: "Active (Institutional)",
    approvedCount: allDocs?.filter(d => d.status === 'የጸደቀ').length || 0,
    pendingCount: allDocs?.filter(d => d.status !== 'የጸደቀ').length || 0
  }), [allDocs, allUsers]);

  const handleOpenFile = (url: string) => {
    if (!url) return;
    const win = window.open();
    if (win) {
      if (url.startsWith('data:')) {
        win.document.write(`<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      } else {
        win.location.href = url;
      }
    }
  };

  const handleApprove = (id: string) => {
    if (!db || !isMasterAdmin) return;
    updateDocumentNonBlocking(doc(db, 'documents', id), { status: 'የጸደቀ' });
    toast({ title: "ጸድቋል", description: "ሰነዱ በትክክል ጸድቋል" });
  };

  const handleDelete = (id: string, uploaderId: string) => {
    if (!db) return;
    if (isMasterAdmin || user?.uid === uploaderId) {
      deleteDocumentNonBlocking(doc(db, 'documents', id));
      toast({ title: "ተሰርዟል", description: "ሰነዱ ከመዝገብ ቤት ተወግዷል" });
    } else {
      toast({ title: "ስልጣን የለዎትም", description: "የራስዎን ፋይል ብቻ ነው ማጥፋት የሚችሉት", variant: "destructive" });
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
            <h1 className="text-xs font-black text-slate-800 uppercase bg-white px-10 py-4 rounded-full shadow-lg border flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-green-500" /> የቢሮ መቆጣጠሪያ ማዕከል
            </h1>
          </header>
          <div className="w-32 flex justify-end">
            {isMasterAdmin && <Badge className="bg-green-500 text-white font-black text-[8px] h-8 px-4 rounded-xl uppercase shadow-sm">Master Admin Access</Badge>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="ጠቅላላ ሰነዶች" value={docsLoading ? "..." : stats.totalDocs.toString()} icon={<FileText className="w-6 h-6 text-blue-600" />} />
          <StatCard title="የጸደቁ" value={docsLoading ? "..." : stats.approvedCount.toString()} icon={<CheckCircle2 className="w-6 h-6 text-green-600" />} />
          <StatCard title="በሂደት ላይ" value={docsLoading ? "..." : stats.pendingCount.toString()} icon={<Clock className="w-6 h-6 text-amber-600" />} />
          <StatCard title="ተመዝጋቢዎች" value={usersLoading ? "..." : stats.totalUsers.toString()} icon={<Users className="w-6 h-6 text-purple-600" />} />
        </div>

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
            ) : !allDocs || allDocs.length === 0 ? (
              <div className="bg-white p-40 text-center">
                <FileText className="w-10 h-10 text-slate-200 mx-auto mb-8" />
                <p className="text-slate-300 text-[11px] font-black uppercase">ምንም እንቅስቃሴ አልተመዘገበም</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {allDocs.map((docItem) => (
                  <div key={docItem.id} className="flex items-center justify-between p-8 hover:bg-slate-50/80 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-white border rounded-2xl flex items-center justify-center shadow-md">
                        <FileText className="w-7 h-7 text-slate-400 group-hover:text-[#1e3a8a] transition-colors" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-black text-slate-900">{docItem.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] text-[#1e3a8a] font-black flex items-center gap-2">
                            <User className="w-3.5 h-3.5" /> {docItem.expertName || docItem.uploaderName || "ባለሙያ"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            <Building2 className="w-3.5 h-3.5 text-slate-300" /> {docItem.sector || "አጠቃላይ"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <Badge variant="outline" className={`text-[9px] border-none px-4 h-8 flex items-center font-black uppercase rounded-full shadow-sm ${docItem.status === 'የጸደቀ' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                        {docItem.status}
                      </Badge>
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => handleOpenFile(docItem.fileUrl)} className="h-12 px-6 text-[11px] font-black rounded-2xl border-slate-200 shadow-sm hover:bg-[#1e3a8a] hover:text-white hover:border-transparent transition-all">
                          <Eye className="w-4 h-4 mr-2" /> ክፈት
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-12 w-12 hover:bg-slate-100 rounded-2xl">
                              <MoreVertical className="w-6 h-6 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64 p-3 rounded-[2rem] shadow-2xl border-none">
                            <DropdownMenuLabel className="text-[10px] uppercase text-slate-400 px-4 py-3 font-black">ተግባራት</DropdownMenuLabel>
                            {(isMasterAdmin && docItem.status !== 'የጸደቀ') && (
                              <DropdownMenuItem onClick={() => handleApprove(docItem.id)} className="text-[12px] font-black cursor-pointer bg-green-50 text-green-700 hover:bg-green-100 rounded-2xl mb-2 p-4">
                                <CheckCircle2 className="w-4 h-4 mr-2" /> አፅድቅ
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild className="text-[12px] font-black cursor-pointer rounded-2xl p-4 hover:bg-slate-50 mb-2">
                              <a href={docItem.fileUrl} download={docItem.fileName || "document"} className="flex items-center w-full">
                                <Download className="w-4 h-4 mr-2 text-[#1e3a8a]" /> አውርድ
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-2 bg-slate-50" />
                            {(isMasterAdmin || user?.uid === docItem.uploaderId) && (
                              <DropdownMenuItem onClick={() => handleDelete(docItem.id, docItem.uploaderId)} className="text-[12px] font-black cursor-pointer text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl p-4">
                                <Trash2 className="w-4 h-4 mr-2" /> ሰርዝ
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <Card className="border-none shadow-xl bg-white overflow-hidden rounded-[2rem]">
      <CardContent className="p-8 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
        </div>
        <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
