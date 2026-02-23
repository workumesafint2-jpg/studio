"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Download, Upload, Play, Save, Trash2, MessageSquare, ChevronRight, Activity } from 'lucide-react';

// 🛠️ Firebase Configuration - Institutional Sync
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "worku-mesafint.firebaseapp.com",
  projectId: "worku-mesafint",
  storageBucket: "worku-mesafint.appspot.com",
  messagingSenderId: "727548532922",
  appId: "1:727548532922:web:656e4c70094054a8528119"
};

// 🚀 Safe Firebase Initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default function BPMNFlowForgeApp() {
  const [isClient, setIsClient] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [input, setInput] = useState("");
  const [records, setRecords] = useState([]);

  // 🔄 Load Data from Firebase on Start
  useEffect(() => {
    setIsClient(true);
    const q = query(collection(db, "processes"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecords(data);
    });
    return () => unsubscribe();
  }, []);

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col text-[#1e293b]">
      {/* 🏛️ Header Section */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-[#1e3a8a] p-2 rounded-lg">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1e3a8a] tracking-tight">ITDB - Innovation and Technology Development Bureau</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Institutional Portal v2.7.7 - Stable</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] text-white rounded-md hover:bg-[#1e3a8a]/90 transition-all font-medium text-sm">
            <Save className="w-4 h-4" /> ዝጋና መዝግብ
          </button>
        </div>
      </header>

      {/* 🏗️ Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: AI & Input */}
        <div className="w-1/3 border-r border-slate-200 bg-white p-6 overflow-y-auto">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">የአገልግሎት ስም</label>
            <input 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all"
              placeholder="የአገልግሎት ስም እዚህ ያስገቡ..."
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">የሂደቱ ዝርዝር ተግባር</label>
            <textarea 
              rows={6}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all"
              placeholder="ዝርዝር ተግባሩን እዚህ ያስገቡ..."
            ></textarea>
          </div>
          <button className="w-full py-4 bg-[#1e3a8a] text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Play className="fill-current w-5 h-5" /> ድያግራም አመንጭ
          </button>
        </div>

        {/* Right Panel: Canvas & Output */}
        <div className="flex-1 bg-slate-50 relative flex flex-col p-6">
           {/* Canvas area (where your BPMN blocks appear) */}
           <div className="flex-1 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-inner flex items-center justify-center overflow-auto p-10">
              {/* ድያግራም እዚህ ይሳላል */}
              <div className="flex items-center gap-8">
                <div className="w-40 h-24 bg-white border-2 border-[#1e3a8a] rounded-xl flex items-center justify-center shadow-md font-bold text-[#1e3a8a]">መጀመሪያ</div>
                <div className="h-0.5 w-16 bg-[#1e3a8a]"></div>
                <div className="w-40 h-24 bg-white border-2 border-[#1e3a8a] rounded-xl flex items-center justify-center shadow-md font-bold text-[#1e3a8a]">መቀበያ</div>
              </div>
           </div>
        </div>
      </main>

      {/* 📊 Records Footer Table */}
      <footer className="h-64 bg-white border-t border-slate-200 p-6 overflow-y-auto">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#1e3a8a]" /> የቅርብ ጊዜ መዝገቦች
        </h3>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest font-bold">
            <tr>
              <th className="px-4 py-3">ስም</th>
              <th className="px-4 py-3">ምድብ</th>
              <th className="px-4 py-3">ሁኔታ</th>
              <th className="px-4 py-3 text-right">ቀን</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-[#1e3a8a]">{rec.name || "ያልተሰየመ"}</td>
                <td className="px-4 py-3 text-slate-500">{rec.category || "አጠቃላይ"}</td>
                <td className="px-4 py-3"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">የጸደቀ</span></td>
                <td className="px-4 py-3 text-right text-slate-400 font-mono">{rec.createdAt?.toDate().toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </footer>

      {/* 🎖️ Institutional Bottom Bar */}
      <div className="bg-[#1e3a8a] text-white py-2 px-6 flex justify-between items-center text-[10px] font-bold tracking-tighter uppercase">
        <span>ITDB PORTAL V2.7.7 - STABLE PRODUCTION</span>
        <span>© 2026 INNOVATION AND TECHNOLOGY DEVELOPMENT BUREAU | ASSISTANT SYNCHRONIZED</span>
      </div>
    </div>
  );
}
