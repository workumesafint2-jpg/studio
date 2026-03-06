
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Institutional Firebase Initializer.
 * v4.3.8 - Resilient Production Sync with enhanced logging
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null };
  }

  // If already initialized, return existing SDKs
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  // Check if configuration exists
  const hasConfig = !!(
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== 'undefined' && 
    firebaseConfig.projectId && 
    firebaseConfig.projectId !== 'undefined'
  );

  if (hasConfig) {
    try {
      const firebaseApp = initializeApp(firebaseConfig);
      console.log('(ወርቁ) Pro: Firebase Initialized successfully.');
      return getSdks(firebaseApp);
    } catch (e) {
      console.error('Firebase initialization failed:', e);
      return { firebaseApp: null, auth: null, firestore: null };
    }
  }

  // If not configured, we run in a restricted "local-only" state
  console.warn('(ወርቁ) WARNING: Firebase configuration missing in Environment Variables.');
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
