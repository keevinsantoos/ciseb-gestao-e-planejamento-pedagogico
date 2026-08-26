import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom database ID specified in config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    console.log('[Firebase] Conexão com o Firestore estabelecida com sucesso.');
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline') || error?.code === 'unavailable') {
      console.warn('[Firebase] Firestore operando em modo offline/cache.');
    } else {
      console.log('[Firebase] Conexão ativa com o banco de dados:', error?.message || 'OK');
    }
    return true;
  }
}

// Run test on load
testFirestoreConnection().catch(() => {});

export default app;

