
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Institutional Firebase Initializer.
 * Enhanced for Vercel build resilience and Zero-Failure initialization.
 */
export function initializeFirebase() {
  // Never initialize during server-side rendering or static export
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null };
  }

  // Check for existing app to avoid re-initialization errors
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  // CRITICAL RESILIENCE: 
  // We check if the config is not just present, but also valid.
  // Next.js static exports sometimes inject 'undefined' as a string.
  const isConfigValid = (
    firebaseConfig.apiKey && 
    String(firebaseConfig.apiKey) !== 'undefined' && 
    firebaseConfig.projectId && 
    String(firebaseConfig.projectId) !== 'undefined'
  );

  if (isConfigValid) {
    try {
      const firebaseApp = initializeApp(firebaseConfig);
      console.log('(ወርቁ) Pro: Firebase Intelligence Activated.');
      return getSdks(firebaseApp);
    } catch (e) {
      console.warn('Firebase initialization failed. Falling back to Standalone Mode.', e);
      return { firebaseApp: null, auth: null, firestore: null };
    }
  }

  // If no config is present, we return null services. 
  // The app is designed to handle this state and keep the Modeler functional.
  console.warn('Firebase credentials missing or invalid. (ወርቁ) Pro is running in Standalone Modeler mode.');
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
    console.error('Failed to retrieve Firebase SDKs:', e);
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
