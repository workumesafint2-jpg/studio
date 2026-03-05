
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Institutional Firebase Initializer.
 * v4.3.0 - Stable Production Sync
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null };
  }

  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  const isConfigValid = !!(
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== 'undefined' && 
    firebaseConfig.projectId && 
    firebaseConfig.projectId !== 'undefined'
  );

  if (isConfigValid) {
    try {
      const firebaseApp = initializeApp(firebaseConfig);
      console.log('(ወርቁ) Pro: Firebase Initialized successfully.');
      return getSdks(firebaseApp);
    } catch (e) {
      console.error('Firebase init failed:', e);
      return { firebaseApp: null, auth: null, firestore: null };
    }
  }

  console.warn('Firebase config missing. Running in Standalone mode.');
  return { firebaseApp: null, auth: null, firestore: null };
}

export function getSdks(firebaseApp: FirebaseApp) {
  try {
    return {
      firebaseApp,
      auth: getAuth(firebaseApp),
      firestore: getFirestore(firebaseApp)
    };
  } catch (e) {
    console.error('Failed to retrieve SDKs:', e);
    return { firebaseApp: null, auth: null, firestore: null };
  }
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
