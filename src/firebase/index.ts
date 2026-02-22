'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Institutional Firebase Initializer.
 * Optimized for Vercel and BPMN Resilience.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null };
  }

  if (!getApps().length) {
    let firebaseApp;
    
    // Check if we have valid config options to avoid 'app/no-options' error
    const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;

    try {
      if (hasConfig) {
        firebaseApp = initializeApp(firebaseConfig);
      } else {
        // Attempt automatic initialization (App Hosting) or fallback
        firebaseApp = initializeApp();
      }
    } catch (e) {
      console.warn('Firebase initialization failed. Running in standalone Modeler mode.', e);
      return { firebaseApp: null, auth: null, firestore: null };
    }

    return getSdks(firebaseApp);
  }

  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
