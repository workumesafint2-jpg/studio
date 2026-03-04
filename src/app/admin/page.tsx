
'use client';

import { useMemo } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, FileText, Users, Activity, Clock, CheckCircle2, Eye, ExternalLink, Building2, User } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
}

interface UserRecord {
  id: string;
  role: string;
  displayName?: string;
  email?: string;
}

export default function AdminPage() {
  const db = useFirestore();

  const docsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
  }, [db]);

  const recentQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'documents'), orderBy('createdAt', 'desc'), limit(15));
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
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AuthGuard>
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
        <header className="flex flex-col gap-2">
          <p className="text-[10px] font-bold text-primary tracking-widest uppercase">ITDB Management Dashboard</p>
          <h1 className="text-3xl font-black text-slate-900 uppercase">የተቋም አስተዳዳሪ መቆጣጠሪያ v3.3.1</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <Card className="shadow-xl border-none">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4" /> የቅርብ ጊዜ የተቋም እንቅስቃሴዎች (Daily Log Sync)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentLoading ? (
              <div className="flex justify-center py-24">
                <Activity className="w-8 h-8 animate-spin text-primary/20" />
              </div>
            ) : !recentDocs || recentDocs.length === 0 ? (
              <div className="bg-white rounded-lg p-24 text-center border-2 border-dashed border-slate-100 m-6">
                <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em]">እንኳን ደህና መጡ! ምንም እንቅስቃሴ አልተመዘገበም።</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center group-hover:border-primary/20 transition-colors shadow-sm">
                        <FileText className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-slate-900 leading-none">{doc.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{doc.category}</span>
                          <span className="text-[9px] text-slate-200">•</span>
                          <span className="text-[10px] text-primary font-black flex items-center gap-1">
                            <User className="w-3 h-3" /> {getUserName(doc)}
                          </span>
                          <span className="text-[9px] text-slate-200">•</span>
                          <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {doc.sector || "General"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-right hidden sm:flex flex-col items-end">
                        <Badge variant="outline" className={`text-[8px] border-none h-5 px-3 mb-1 font-bold ${doc.status === 'የጸደቀ' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          {doc.status}
                        </Badge>
                        <span className="text-[9px] text-slate-400 font-medium tabular-nums">
                          {doc.uploadDate ? new Date(doc.uploadDate).toLocaleString('am-ET') : '--'}
                        </span>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 px-4 rounded-xl border-slate-200 hover:bg-primary hover:text-white hover:border-primary transition-all group/btn"
                        onClick={() => handleOpenFile(doc.fileUrl)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        ከፍት
                      </Button>
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
    <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        {icon}
      </div>
      <CardContent className="p-6 flex items-center justify-between relative z-10">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-2xl font-black text-slate-900">{value}</h3>
        </div>
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-primary/5 transition-colors">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
