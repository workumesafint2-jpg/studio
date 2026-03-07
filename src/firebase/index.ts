'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * ITB Pro: Institutional Firebase Initializer.
 * v5.5.2 - Enhanced Production Resiliency
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
      console.log('ITB Pro: Firebase Initialized successfully.');
      return getSdks(firebaseApp);
    } catch (e) {
      console.error('ITB Pro: Firebase initialization failed:', e);
      return { firebaseApp: null, auth: null, firestore: null };
    }
  }

  // If not configured, we return nulls but with clear logging
  console.warn('ITB Pro: Missing Firebase Environment Variables. UI will show warnings.');
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
    console.error('ITB Pro: Failed to retrieve SDKs:', e);
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
