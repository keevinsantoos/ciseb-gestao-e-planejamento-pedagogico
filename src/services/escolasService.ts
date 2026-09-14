import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { CisebEscola } from '../types';

export const ESCOLAS_COLLECTION = 'escolas';
const ESCOLAS_STORAGE_KEY = 'ciseb_canonical_escolas_v1';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('[EscolasService] Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * 16 Unidades Escolares Oficiais Canônicas do CISEB / SEDUC-PA
 * + Unidade Administrativa de Coordenação Geral
 */
export const CANONICAL_ESCOLAS: CisebEscola[] = [
  {
    id: 'ciseb-augusto-meira',
    nome: 'CISEB - EE AUGUSTO MEIRA',
    municipio: 'Belém',
    status: 'ativo',
    dataCriacao: '2026-01-01',
  },
  {
    id: 'ciseb-barao-rio-branco',
    nome: 'CISEB - EE BARÃO DO RIO BRANCO',
    municipio: 'Belém',
    status: 'ativo',
    dataCriacao: '2026-01-01',
  },
  {
    id: 'ciseb-celso-rodrigues',
    nome: 'CISEB - EE CELSO RODRIGUES',
    municipio: 'Belém',
    status: 'ativo',
    dataCriacao: '2026-01-01',
  },
  {
    id: 'ciseb-laurindo-azeitona',
    nome: 'CISEB - EE COMANDANTE LAURINDO CANDIDO AZEITONA',
    municipio: 'Belém',
    status: 'ativo',
    dataCriacao: '2026-01-01',
  },
  {
    id: 'ciseb-fabio-luz',
    nome: 'CISEB - EE DR FÁBIO LUZ',
    municipio: 'Tomé-Açu',
    status: 'ativo',
    dataCriacao: '2026-01-01',
  },
  {
    id: 'ciseb-gaspar-viana',
    nome: 'CISEB - EE DR GASPAR VIANA',
    municipio: 'Marabá',
    status: 'ativo',
    dataCriacao: '2026-01-01',
  },
  {
    id: 'ciseb-justo-chermont',
    nome: 'CISEB - EE DR JUSTO CHERMONT',
    municipio: 'Belém',
    status: 'ativo',
    dataCriacao: '2026-01-01',
  },
  {
    id: 'ciseb-eriberto-jasper',
    nome: 'CISEB - EE ERIBERTO JASPER',
    municipio: 'Belém',
    status: 'ativo',
    dataCriacao: '2026-01-01',
  },
  {
    id: 'ciseb-romildo-veloso',
    nome: 'CISEB - EE DR ROMILDO VELOSO E SILVA',
    municipio: 'Xinguara',
    status: 'ativo',
    dataCriacao: '2026-01-01',
  },
  {
    id: 'ciseb-izidorio-souza',
    nome: 'CISEB - EE IZIDORIO FRANCISCO DE SOUZA',
    municipio: 'Belém',
    status: 'ativo',
    dataCriacao: '2026-01-01',
  },
  {
    id: 'ciseb-jose-alencar',
    nome: 'CISEB - EE JOSE DE ALENCAR',
    municipio: 'Belém',
    status: 'ativo',
    dataCriacao: '2026-01-01',
  },
  {
    id: 'ciseb-macario-dantas',
    nome: 'CISEB - EE MACÁRIO DANTAS',
    municipio: 'Belém',
    status: 'ativo',
    dataCriacao: '2026-01-01',
  },
  {
    id: 'ciseb-cordeiro-farias',
    nome: 'CISEB - EE MARECHAL CORDEIRO DE FARIAS',
    municipio: 'Belém',
    status: 'ativo',
    dataCriacao: '2026-01-01',
  },
  {
    id: 'ciseb-maria-balbino',
    nome: 'CISEB - EE MARIA DAS GRACAS BALBINO CORREA',
    municipio: 'Belém',
    status: 'ativo',
    dataCriacao: '2026-01-01',
  },
  {
    id: 'ciseb-paulino-brito',
    nome: 'CISEB - EE PAULINO DE BRITO',
    municipio: 'Breves',
    status: 'ativo',
    dataCriacao: '2026-01-01',
  },
  {
    id: 'ciseb-pedro-pedroso',
    nome: 'CISEB - EE PEDRO AMAZONAS PEDROSO',
    municipio: 'Belém',
    status: 'ativo',
    dataCriacao: '2026-01-01',
  },
  {
    id: 'ciseb-mestra-idalina',
    nome: 'CISEB - EE MESTRA IDALINA RODRIGUES PEREIRA',
    municipio: 'São Caetano de Odivelas',
    status: 'ativo',
    dataCriacao: '2026-09-14',
  },
  {
    id: 'ciseb-pequeno-principe',
    nome: 'CISEB - EE PEQUENO PRÍNCIPE',
    municipio: 'Marabá',
    status: 'ativo',
    dataCriacao: '2026-09-14',
  },
  {
    id: 'ciseb-ruy-paranatinga',
    nome: 'CISEB - EE RUY PARANATINGA BARATA',
    municipio: 'Belém',
    status: 'ativo',
    dataCriacao: '2026-09-14',
  },
  {
    id: 'ciseb-profa-placidia-cardoso',
    nome: 'CISEB - EE PROFª PLACÍDIA CARDOSO',
    municipio: 'Belém',
    status: 'ativo',
    dataCriacao: '2026-09-14',
  },
  {
    id: 'ciseb-profa-marta-conceicao',
    nome: 'CISEB - EE PROFª MARTA DA CONCEIÇÃO',
    municipio: 'Belém',
    status: 'ativo',
    dataCriacao: '2026-09-14',
  },
  {
    id: 'ciseb-coordenacao-geral',
    nome: 'CISEB - COORDENAÇÃO GERAL SEDUC/PA',
    municipio: 'Belém',
    status: 'ativo',
    dataCriacao: '2026-01-01',
  },
];

/**
 * Encontra a escola pelo ID
 */
export function getCanonicalEscolaById(escolaId: string): CisebEscola | undefined {
  return CANONICAL_ESCOLAS.find((e) => e.id === escolaId);
}

/**
 * Normaliza e busca a escola pelo nome ou string da unidade
 */
export function findEscolaByNameOrUnit(unitNameOrId: string): CisebEscola {
  if (!unitNameOrId) {
    return CANONICAL_ESCOLAS[0];
  }
  const clean = unitNameOrId.trim().toLowerCase();

  // 1. Busca direta por ID
  const byId = CANONICAL_ESCOLAS.find((e) => e.id.toLowerCase() === clean);
  if (byId) return byId;

  // 2. Busca exata por nome
  const byName = CANONICAL_ESCOLAS.find((e) => e.nome.toLowerCase() === clean);
  if (byName) return byName;

  // 3. Busca por similaridade de nome (sem prefixos)
  const stripped = clean
    .replace(/^ciseb\s*[-–]\s*/i, '')
    .replace(/^ee\s*/i, '')
    .replace(/^eeem\s*/i, '')
    .trim();

  const byPartial = CANONICAL_ESCOLAS.find((e) => {
    const escStripped = e.nome
      .toLowerCase()
      .replace(/^ciseb\s*[-–]\s*/i, '')
      .replace(/^ee\s*/i, '')
      .replace(/^eeem\s*/i, '')
      .trim();
    return escStripped.includes(stripped) || stripped.includes(escStripped);
  });

  if (byPartial) return byPartial;

  // Fallback padrão seguro
  return CANONICAL_ESCOLAS[0];
}

/**
 * Inicializa a coleção /escolas no Firestore com os dados canônicos.
 * Garante idempotência e nunca duplica escolas.
 */
export async function seedEscolasToFirestore(): Promise<void> {
  try {
    for (const escola of CANONICAL_ESCOLAS) {
      const docRef = doc(db, ESCOLAS_COLLECTION, escola.id);
      await setDoc(docRef, escola, { merge: true });
    }
    console.log('[EscolasService] 16 Escolas Canônicas sincronizadas no Firestore com sucesso.');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, ESCOLAS_COLLECTION);
  }
}

/**
 * Retorna a lista de todas as escolas cadastradas (do Firestore com fallback local)
 */
export async function fetchAllEscolas(): Promise<CisebEscola[]> {
  try {
    const colRef = collection(db, ESCOLAS_COLLECTION);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list: CisebEscola[] = [];
      snap.forEach((d) => list.push(d.data() as CisebEscola));
      // Ordena por nome
      list.sort((a, b) => a.nome.localeCompare(b.nome));
      localStorage.setItem(ESCOLAS_STORAGE_KEY, JSON.stringify(list));
      return list;
    }
  } catch (error) {
    console.warn('[EscolasService] Falha ao consultar escolas no Firestore, utilizando cache canônico.');
  }

  // Fallback local
  try {
    const local = localStorage.getItem(ESCOLAS_STORAGE_KEY);
    if (local) {
      return JSON.parse(local);
    }
  } catch {}

  return CANONICAL_ESCOLAS;
}

/**
 * Assina atualizações em tempo real da coleção /escolas
 */
export function subscribeEscolas(callback: (escolas: CisebEscola[]) => void): () => void {
  try {
    const colRef = collection(db, ESCOLAS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: CisebEscola[] = [];
          snapshot.forEach((d) => list.push(d.data() as CisebEscola));
          list.sort((a, b) => a.nome.localeCompare(b.nome));
          localStorage.setItem(ESCOLAS_STORAGE_KEY, JSON.stringify(list));
          callback(list);
        } else {
          // Se vazio, auto-popula com as 16 canônicas
          seedEscolasToFirestore()
            .then(() => callback(CANONICAL_ESCOLAS))
            .catch(() => callback(CANONICAL_ESCOLAS));
        }
      },
      (error) => {
        console.warn('[EscolasService] Falha na assinatura de escolas:', error.message);
        callback(CANONICAL_ESCOLAS);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('[EscolasService] Erro ao registrar listener de escolas:', error);
    callback(CANONICAL_ESCOLAS);
    return () => {};
  }
}
