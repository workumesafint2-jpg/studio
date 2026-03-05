
'use client';

import { useMemo } from 'react';
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
  ExternalLink, 
  Building2, 
  User,
  MoreVertical,
  Download,
  Trash2
} from 'lucide-react';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  directorate?: string;
  team?: string;
  expertName?: string;
  createdAt?: any;
  fileName?: string;
}

interface UserRecord {
  id: string;
  role: string;
  displayName?: string;
  email?: string;
}

export default function AdminPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const docsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
  }, [db]);

  const recentQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('createdAt', 'desc'), limit(20));
  }, [db]);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'));
  }, [db]);

  const { data: allDocs, isLoading: docsLoading } = useCollection<DocumentRecord>(docsQuery);
  const { data: recentDocs, isLoading: recentLoading } = useCollection<DocumentRecord>(recentQuery);
  const { data: allUsers, isLoading: usersLoading } = useCollection<UserRecord>(usersQuery);

  const stats = useMemo(() => ({
    totalDocs: allDocs?.length || 0,
    totalUsers: allUsers?.length || 0,
    status: "Active",
    activeWorkflows: allDocs?.filter(d => d.status !== 'የጸደቀ').length || 0
  }), [allDocs, allUsers]);

  const getUserName = (doc: DocumentRecord) => {
    if (doc.expertName) return doc.expertName;
    if (doc.uploaderName) return doc.uploaderName;
    const user = allUsers?.find(u => u.id === doc.uploaderId);
    return user?.displayName || user?.email || "ያልታወቀ ሰራተኛ";
  };

  const handleOpenFile = (url: string) => {
    if (!url) return;
    const win = window.open();
    if (win) {
      if (url.startsWith('data:')) {
        win.document.write(`<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      } else {
        win.location.href = url;
      }
    } else {
      toast({ title: "Error", description: "Pop-up blocked. Please allow pop-ups.", variant: "destructive" });
    }
  };

  const handleApprove = (id: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'documents', id), { status: 'የጸደቀ' });
    toast({ title: "ጸድቋል", description: "ሰነዱ በትክክል ጸድቋል።" });
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'documents', id));
    toast({ title: "ተሰርዟል", description: "ሰነዱ ከመዝገብ ቤት ተወግዷል።" });
  };

  return (
    <AuthGuard>
      <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
        <header className="flex flex-col items-center gap-1 mb-8">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">ኢኖቬሽንና ቴክኖሎጂ ቢሮ</h2>
          <div className="w-12 h-12 bg-[#1e3a8a] rounded-xl flex items-center justify-center text-white shadow-lg mb-1">
             <span className="font-black text-sm">ITB</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Innovation & Technology Bureau</p>
          <h1 className="text-sm font-black text-slate-800 uppercase mt-2 bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-100">
            የአስተዳዳሪ መቆጣጠሪያ v3.8.1
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="ጠቅላላ ሰነዶች" 
            value={docsLoading ? "..." : stats.totalDocs.toString()} 
            icon={<FileText className="w-5 h-5 text-blue-600" />} 
          />
          <StatCard 
            title="ንቁ ሰራተኞች" 
            value={usersLoading ? "..." : stats.totalUsers.toString()} 
            icon={<Users className="w-5 h-5 text-green-600" />} 
          />
          <StatCard 
            title="የሲስተም ሁኔታ" 
            value={stats.status} 
            icon={<Activity className="w-5 h-5 text-amber-600" />} 
          />
          <StatCard 
            title="ንቁ ሂደቶች" 
            value={docsLoading ? "..." : stats.activeWorkflows.toString()} 
            icon={<LayoutDashboard className="w-5 h-5 text-purple-600" />} 
          />
        </div>

        <Card className="shadow-lg border-none overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-50 py-4">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4" /> የቅርብ ጊዜ የተቋም እንቅስቃሴዎች (Real-Time Sync)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentLoading ? (
              <div className="flex justify-center py-24">
                <Activity className="w-8 h-8 animate-spin text-primary/20" />
              </div>
            ) : !recentDocs || recentDocs.length === 0 ? (
              <div className="bg-white rounded-lg p-24 text-center border-2 border-dashed border-slate-100 m-6">
                <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">እንቅስቃሴ አልተመዘገበም</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentDocs.map((docItem) => (
                  <div key={docItem.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center group-hover:border-primary/20 transition-colors shadow-sm">
                        <FileText className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-black text-slate-900 leading-none">{docItem.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{docItem.category}</span>
                          <span className="text-[8px] text-slate-200">•</span>
                          <span className="text-[9px] text-primary font-black flex items-center gap-1">
                            <User className="w-3 h-3" /> {getUserName(docItem)}
                          </span>
                          <span className="text-[8px] text-slate-200">•</span>
                          <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {docItem.sector || "General"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:flex flex-col items-end">
                        <Badge variant="outline" className={`text-[7px] border-none h-4 px-2 mb-0.5 font-black ${docItem.status === 'የጸደቀ' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          {docItem.status}
                        </Badge>
                        <span className="text-[8px] text-slate-400 font-medium tabular-nums">
                          {docItem.uploadDate ? new Date(docItem.uploadDate).toLocaleString('am-ET') : '--'}
                        </span>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-slate-100 rounded-xl">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1">
                          <DropdownMenuItem onClick={() => handleOpenFile(docItem.fileUrl)} className="text-[10px] font-black cursor-pointer">
                            <Eye className="w-3.5 h-3.5 mr-2 text-blue-500" /> ክፈት (Open)
                          </DropdownMenuItem>
                          {docItem.status !== 'የጸደቀ' && (
                            <DropdownMenuItem onClick={() => handleApprove(docItem.id)} className="text-[10px] font-black cursor-pointer">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-green-500" /> አፅድቅ (Approve)
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild className="text-[10px] font-black cursor-pointer">
                            <a href={docItem.fileUrl} download={docItem.fileName || "document"} className="flex items-center w-full">
                              <Download className="w-3.5 h-3.5 mr-2 text-primary" /> አውርድ (Download)
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(docItem.id)} className="text-[10px] font-black cursor-pointer text-red-600">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> ሰርዝ (Delete)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
    <Card className="border-none shadow-md hover:shadow-lg transition-all bg-white overflow-hidden relative group rounded-2xl">
      <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
        {icon}
      </div>
      <CardContent className="p-5 flex items-center justify-between relative z-10">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{title}</p>
          <h3 className="text-xl font-black text-slate-900">{value}</h3>
        </div>
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-[#1e3a8a]/5 transition-colors">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
