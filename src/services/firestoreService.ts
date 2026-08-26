import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CisebSessionPlan, CisebRegisteredAccount, isPlanExpired } from '../types';
import { DEFAULT_INITIAL_ACCOUNTS, CISEB_ACCOUNTS_STORAGE_KEY } from '../data/cisebAccounts';

const PLANS_COLLECTION = 'plans';
const ACCOUNTS_COLLECTION = 'accounts';
const PLANS_STORAGE_KEY = 'ciseb_saved_plans_v2';

// ----------------------------------------------------
// PLANS FIRESTORE OPERATIONS
// ----------------------------------------------------

/**
 * Remove automaticamente planos com mais de 7 dias de criação/edição
 * para evitar acúmulo de armazenamento e cache.
 */
export async function purgeExpiredPlans(plans: CisebSessionPlan[]): Promise<CisebSessionPlan[]> {
  const validPlans: CisebSessionPlan[] = [];
  const expiredPlans: CisebSessionPlan[] = [];

  for (const plan of plans) {
    if (isPlanExpired(plan)) {
      expiredPlans.push(plan);
    } else {
      validPlans.push(plan);
    }
  }

  if (expiredPlans.length > 0) {
    console.log(`[FirestoreService] Purgando ${expiredPlans.length} plano(s) expirado(s) (> 7 dias)...`);
    for (const exp of expiredPlans) {
      deletePlanFromFirestore(exp.id).catch((err) => {
        console.warn(`[FirestoreService] Falha ao excluir plano expirado ${exp.id}:`, err);
      });
    }
  }

  return validPlans;
}


/**
 * Save or update a session plan in Firestore and localStorage
 */
export async function savePlanToFirestore(plan: CisebSessionPlan): Promise<void> {
  // Update local storage first for instant feedback
  try {
    const localRaw = localStorage.getItem(PLANS_STORAGE_KEY);
    const list: CisebSessionPlan[] = localRaw ? JSON.parse(localRaw) : [];
    const index = list.findIndex(p => p.id === plan.id);
    if (index >= 0) {
      list[index] = plan;
    } else {
      list.unshift(plan);
    }
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('[FirestoreService] Erro ao salvar localmente:', e);
  }

  // Persist in Firestore
  try {
    const planRef = doc(db, PLANS_COLLECTION, plan.id);
    // Sanitize undefined fields for Firestore
    const sanitized = JSON.parse(JSON.stringify(plan));
    await setDoc(planRef, sanitized, { merge: true });
    console.log(`[Firestore] Plano ${plan.id} salvo com sucesso no Firestore.`);
  } catch (error) {
    console.error('[Firestore] Erro ao salvar plano no Firestore:', error);
  }
}

/**
 * Delete a plan from Firestore and localStorage
 */
export async function deletePlanFromFirestore(planId: string): Promise<void> {
  try {
    const localRaw = localStorage.getItem(PLANS_STORAGE_KEY);
    if (localRaw) {
      const list: CisebSessionPlan[] = JSON.parse(localRaw);
      const filtered = list.filter(p => p.id !== planId);
      localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('[FirestoreService] Erro ao deletar localmente:', e);
  }

  try {
    await deleteDoc(doc(db, PLANS_COLLECTION, planId));
    console.log(`[Firestore] Plano ${planId} excluído do Firestore.`);
  } catch (error) {
    console.error('[Firestore] Erro ao excluir plano do Firestore:', error);
  }
}

/**
 * Real-time listener for plans in Firestore
 */
export function subscribePlans(callback: (plans: CisebSessionPlan[]) => void): () => void {
  try {
    const q = collection(db, PLANS_COLLECTION);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const plans: CisebSessionPlan[] = [];
          snapshot.forEach((docSnap) => {
            plans.push(docSnap.data() as CisebSessionPlan);
          });
          // Sort by updatedAt descending
          plans.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
          
          // Purge plans older than 7 days
          purgeExpiredPlans(plans).then((activePlans) => {
            // Update local storage backup
            localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(activePlans));
            callback(activePlans);
          });
        } else {
          // If empty in Firestore, check local storage
          const localRaw = localStorage.getItem(PLANS_STORAGE_KEY);
          if (localRaw) {
            try {
              const localPlans: CisebSessionPlan[] = JSON.parse(localRaw);
              purgeExpiredPlans(localPlans).then((activePlans) => {
                if (activePlans.length > 0) {
                  // Seed local plans to Firestore
                  activePlans.forEach(p => savePlanToFirestore(p));
                  callback(activePlans);
                }
              });
            } catch {}
          }
        }
      },
      (error) => {
        console.warn('[Firestore] Falha na sincronização em tempo real de planos:', error.message);
        // Fallback to local
        const localRaw = localStorage.getItem(PLANS_STORAGE_KEY);
        if (localRaw) {
          try {
            const localPlans: CisebSessionPlan[] = JSON.parse(localRaw);
            const activePlans = localPlans.filter(p => !isPlanExpired(p));
            callback(activePlans);
          } catch {}
        }
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error('[Firestore] Erro ao assinar planos:', error);
    return () => {};
  }
}

// ----------------------------------------------------
// ACCOUNTS FIRESTORE OPERATIONS
// ----------------------------------------------------

/**
 * Save or update an account in Firestore
 */
export async function saveAccountToFirestore(account: CisebRegisteredAccount): Promise<void> {
  // Update local storage
  try {
    const raw = localStorage.getItem(CISEB_ACCOUNTS_STORAGE_KEY);
    const list: CisebRegisteredAccount[] = raw ? JSON.parse(raw) : DEFAULT_INITIAL_ACCOUNTS;
    const index = list.findIndex(a => a.id === account.id);
    if (index >= 0) {
      list[index] = account;
    } else {
      list.push(account);
    }
    localStorage.setItem(CISEB_ACCOUNTS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('[FirestoreService] Erro ao salvar conta localmente:', e);
  }

  // Firestore sync (Passwords must NEVER be written to Firestore)
  try {
    const accRef = doc(db, ACCOUNTS_COLLECTION, account.id);
    const sanitized = JSON.parse(JSON.stringify(account));
    delete sanitized.senha;
    await setDoc(accRef, sanitized, { merge: true });
    console.log(`[Firestore] Conta ${account.nome} sincronizada no Firestore.`);
  } catch (error) {
    console.error('[Firestore] Erro ao sincronizar conta no Firestore:', error);
  }
}


/**
 * Delete an account from Firestore
 */
export async function deleteAccountFromFirestore(accountId: string): Promise<void> {
  try {
    const raw = localStorage.getItem(CISEB_ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const list: CisebRegisteredAccount[] = JSON.parse(raw);
      const filtered = list.filter(a => a.id !== accountId);
      localStorage.setItem(CISEB_ACCOUNTS_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('[FirestoreService] Erro ao deletar conta localmente:', e);
  }

  try {
    await deleteDoc(doc(db, ACCOUNTS_COLLECTION, accountId));
    console.log(`[Firestore] Conta ${accountId} excluída do Firestore.`);
  } catch (error) {
    console.error('[Firestore] Erro ao excluir conta do Firestore:', error);
  }
}

/**
 * Real-time listener for accounts in Firestore with auto-seeding
 */
export function subscribeAccounts(callback: (accounts: CisebRegisteredAccount[]) => void): () => void {
  try {
    const q = collection(db, ACCOUNTS_COLLECTION);
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (!snapshot.empty) {
          const accountsMap = new Map<string, CisebRegisteredAccount>();
          
          // Seed defaults into map (Monitoramento & Coordenação)
          DEFAULT_INITIAL_ACCOUNTS.forEach(acc => {
            accountsMap.set(acc.email.toLowerCase(), { ...acc });
          });

          // Overlay snapshot data (ignoring and deleting deprecated pre-seeded form_ accounts)
          snapshot.forEach((docSnap) => {
            if (docSnap.id.startsWith('form_')) {
              // Asynchronously clean up deprecated pre-seeded sample accounts
              deleteDoc(doc(db, ACCOUNTS_COLLECTION, docSnap.id)).catch(() => {});
              return;
            }

            const data = docSnap.data() as CisebRegisteredAccount;
            const emailKey = data.email?.toLowerCase();
            if (emailKey) {
              const defaultAcc = DEFAULT_INITIAL_ACCOUNTS.find(d => d.email.toLowerCase() === emailKey);
              if (defaultAcc) {
                // Keep official credentials updated for default accounts
                accountsMap.set(emailKey, {
                  ...data,
                  nome: defaultAcc.nome,
                  unidadeCiseb: defaultAcc.unidadeCiseb,
                  email: defaultAcc.email,
                  role: defaultAcc.role,
                });
              } else {
                accountsMap.set(emailKey, data);
              }
            }
          });
          
          const accounts = Array.from(accountsMap.values());
          // Sort by name
          accounts.sort((a, b) => a.nome.localeCompare(b.nome));
          
          // Update local backup
          localStorage.setItem(CISEB_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
          callback(accounts);
        } else {
          // Empty in Firestore: Seed with default management & coordination
          console.log('[Firestore] Inicializando contas de gestão e coordenação no Firestore...');
          const initial = DEFAULT_INITIAL_ACCOUNTS;
          try {
            const batch = writeBatch(db);
            initial.forEach(acc => {
              const ref = doc(db, ACCOUNTS_COLLECTION, acc.id);
              batch.set(ref, acc);
            });
            await batch.commit();
            console.log('[Firestore] Contas de coordenação e monitoramento salvas com sucesso.');
          } catch (e) {
            console.error('[Firestore] Erro ao salvar contas no Firestore:', e);
          }
          callback(initial);
        }
      },
      (error) => {
        console.warn('[Firestore] Falha na sincronização de contas:', error.message);
        // Fallback to local
        const raw = localStorage.getItem(CISEB_ACCOUNTS_STORAGE_KEY);
        if (raw) {
          try {
            callback(JSON.parse(raw));
          } catch {
            callback(DEFAULT_INITIAL_ACCOUNTS);
          }
        } else {
          callback(DEFAULT_INITIAL_ACCOUNTS);
        }
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error('[Firestore] Erro ao assinar contas:', error);
    return () => {};
  }
}
