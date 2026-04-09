import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, limit, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set persistence to browserLocalPersistence for better UX (stays logged in across sessions)
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.error("Persistence error:", err);
});

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Force account selection to allow switching accounts
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Error Handling Utility
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  
  let userFriendlyMessage = "An unexpected error occurred with the database.";
  
  if (message.includes('permission-denied') || message.includes('insufficient permissions')) {
    switch (operationType) {
      case OperationType.CREATE:
        userFriendlyMessage = "You don't have permission to create this item. Please check your account type.";
        break;
      case OperationType.UPDATE:
        userFriendlyMessage = "You don't have permission to update this item. You may not be the owner.";
        break;
      case OperationType.DELETE:
        userFriendlyMessage = "You don't have permission to delete this item.";
        break;
      case OperationType.GET:
      case OperationType.LIST:
        userFriendlyMessage = "You don't have permission to view this data.";
        break;
      default:
        userFriendlyMessage = "Security rules prevented this action.";
    }
  } else if (message.includes('quota-exceeded')) {
    userFriendlyMessage = "Database quota exceeded. Please try again later.";
  } else if (message.includes('not-found')) {
    userFriendlyMessage = "The requested item was not found.";
  }

  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };

  console.error(`Firestore Error [${operationType}] on ${path}:`, JSON.stringify(errInfo));
  
  // Throw a custom error that includes the user-friendly message
  const customError = new Error(userFriendlyMessage);
  (customError as any).details = errInfo;
  throw customError;
}
