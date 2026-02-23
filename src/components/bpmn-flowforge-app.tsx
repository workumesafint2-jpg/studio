"use client";

import React, { useEffect, useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// 🛠️ Firebase Configuration - ይህን ክፍል AIው አዘጋጅቶልሃል
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "worku-mesafint.firebaseapp.com",
  projectId: "worku-mesafint",
  storageBucket: "worku-mesafint.appspot.com",
  messagingSenderId: "727548532922",
  appId: "1:727548532922:web:xxxxxx" // እዚህ ጋር ያንተን App ID ይጠቀማል
};

// 🚀 Firebase Initialization Fix
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default function BPMNFlowForgeApp() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* 🏛️ Institutional Footer v2.7.7 */}
      <main className="p-8">
        <h1 className="text-2xl font-bold text-[#1e3a8a]">Innovation and Technology Development Bureau</h1>
        <p className="mt-4 text-gray-600">Institutional Portal - System Optimized</p>
        
        {/* እዚህ ጋር የፕሮጀክትህ ዋና ይዘት ይቀጥላል */}
        <div className="mt-10 p-6 border-2 border-dashed border-[#facc15] rounded-lg text-center">
          <span className="text-[#1e3a8a] font-medium">BPMN Engine Ready | v2.7.7 Sync</span>
        </div>
      </main>

      <footer className="fixed bottom-0 w-full p-4 bg-[#1e3a8a] text-white text-center text-sm">
        © 2026 INNOVATION AND TECHNOLOGY DEVELOPMENT BUREAU | SYSTEM OPTIMIZED
      </footer>
    </div>
  );
}
