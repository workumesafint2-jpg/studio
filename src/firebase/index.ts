'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Institutional Firebase Initializer.
 * Optimized for Vercel build resilience and BPMN standalone functionality.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null };
  }

  // Check for existing app to avoid re-initialization errors
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  // CRITICAL: Only initialize if we have a valid configuration.
  // This prevents the 'app/no-options' error during Next.js static generation.
  const hasConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

  if (hasConfig) {
    try {
      const firebaseApp = initializeApp(firebaseConfig);
      return getSdks(firebaseApp);
    } catch (e) {
      console.warn('Firebase initialization failed. Falling back to standalone mode.', e);
      return { firebaseApp: null, auth: null, firestore: null };
    }
  }

  // If no config is present, we return null services. 
  // The app is designed to handle this state and keep the Modeler functional.
  console.warn('Firebase configuration missing. (ወርቁ) Pro is running in standalone Modeler mode.');
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
