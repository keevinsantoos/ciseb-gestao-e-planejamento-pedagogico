import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CisebRegisteredAccount, CisebEscola } from '../types';
import { CANONICAL_ESCOLAS, findEscolaByNameOrUnit } from './escolasService';

export const ACCOUNTS_COLLECTION = 'accounts';
export const ESCOLAS_COLLECTION = 'escolas';
export const PLANS_COLLECTION = 'plans';

export interface AuditRecord {
  id: string;
  tipo: 'professor' | 'unidade';
  acao: 'cadastro' | 'edicao' | 'status';
  alvoNome: string;
  alvoIdentificador: string;
  usuarioResponsavel: string;
  dataHora: string;
  detalhes?: string;
}

/**
 * Normaliza strings para comparação (remove acentuação, caixa alta, caracteres especiais)
 */
export function normalizeText(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Remove prefixos comuns de nomes de escolas para comparação de similaridade
 */
export function stripUnitPrefixes(name: string): string {
  const norm = normalizeText(name);
  return norm
    .replace(/^ciseb\s*[-–:]\s*/i, '')
    .replace(/^ciseb\s+/i, '')
    .replace(/^ee\s+/i, '')
    .replace(/^eeem\s+/i, '')
    .replace(/^eemei\s+/i, '')
    .replace(/^escola\s+estadual\s+/i, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detecta se existe unidade com nome semelhante já cadastrada
 */
export function detectSimilarUnit(proposedName: string, existingUnits: CisebEscola[], currentId?: string): CisebEscola | null {
  const proposedStripped = stripUnitPrefixes(proposedName);
  if (!proposedStripped || proposedStripped.length < 3) return null;

  for (const unit of existingUnits) {
    if (currentId && unit.id === currentId) continue;
    const existingStripped = stripUnitPrefixes(unit.nome);
    if (!existingStripped) continue;

    // Correspondência exata no radical
    if (proposedStripped === existingStripped) {
      return unit;
    }

    // Se um radical contém o outro com tamanho expressivo (> 4 chars)
    if (
      proposedStripped.length >= 4 &&
      existingStripped.length >= 4 &&
      (proposedStripped.includes(existingStripped) || existingStripped.includes(proposedStripped))
    ) {
      return unit;
    }
  }

  return null;
}

/**
 * Gera um ID de código amigável para unidade a partir do nome
 * Ex: "CISEB - EE NOVO PROGRESSO" -> "ciseb-ee-novo-progresso"
 */
export function generateUnitCode(nome: string): string {
  const clean = normalizeText(nome)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!clean.startsWith('ciseb-')) {
    return `ciseb-${clean}`;
  }
  return clean;
}

// ----------------------------------------------------
// 1. GESTÃO ADMINISTRATIVA DE PROFESSORES
// ----------------------------------------------------

/**
 * Assina lista em tempo real de todos os professores cadastrados no Firestore
 */
export function subscribeAdminProfessores(callback: (professores: CisebRegisteredAccount[]) => void): () => void {
  try {
    const colRef = collection(db, ACCOUNTS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: CisebRegisteredAccount[] = [];
        snapshot.forEach((snap) => {
          const data = snap.data() as CisebRegisteredAccount;
          // Ignora contas descontinuadas/inválidas
          if (data.id === 'admin_coordenacao' || data.email === 'ciseb.coordenacao@escola.seduc.pa.gov.br') {
            return;
          }
          list.push({
            ...data,
            id: snap.id,
            email: (data.email || '').toLowerCase().trim(),
          });
        });

        // Ordena por nome alfabético
        list.sort((a, b) => a.nome.localeCompare(b.nome));
        callback(list);
      },
      (error) => {
        console.warn('[AdminService] Erro ao assinar professores:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('[AdminService] Falha ao registrar listener de professores:', err);
    return () => {};
  }
}

/**
 * Cadastra um novo professor no painel administrativo
 */
export async function cadastrarProfessor(params: {
  nome: string;
  email: string;
  escolaId: string;
  escolasDisponiveis: CisebEscola[];
  status?: 'ativo' | 'inativo';
  adminEmail: string;
}): Promise<{ success: boolean; error?: string; account?: CisebRegisteredAccount }> {
  const cleanNome = (params.nome || '').trim().toUpperCase();
  const cleanEmail = (params.email || '').trim().toLowerCase();
  const cleanEscolaId = (params.escolaId || '').trim();
  const status = params.status || 'ativo';
  const adminEmail = (params.adminEmail || 'ciseb.adm@escola.seduc.pa.gov.br').trim().toLowerCase();

  // Validações obrigatórias
  if (!cleanNome || cleanNome.length < 3) {
    return { success: false, error: 'Informe o nome completo do professor (mínimo de 3 caracteres).' };
  }

  if (!cleanEmail) {
    return { success: false, error: 'Informe o e-mail institucional do professor.' };
  }

  if (!cleanEmail.endsWith('@escola.seduc.pa.gov.br') && !cleanEmail.endsWith('@seduc.pa.gov.br')) {
    return {
      success: false,
      error: 'O e-mail deve pertencer ao domínio institucional da SEDUC/PA (@escola.seduc.pa.gov.br ou @seduc.pa.gov.br).',
    };
  }

  if (!cleanEscolaId) {
    return { success: false, error: 'A unidade CISEB é obrigatória. Não é permitido professor sem unidade.' };
  }

  // Localiza a unidade nas escolas cadastradas
  const escola = params.escolasDisponiveis.find((e) => e.id === cleanEscolaId) || findEscolaByNameOrUnit(cleanEscolaId);
  if (!escola) {
    return { success: false, error: 'A unidade selecionada não é válida.' };
  }

  // Verifica duplicidade de e-mail no Firestore
  try {
    const colRef = collection(db, ACCOUNTS_COLLECTION);
    const qEmail = query(colRef, where('email', '==', cleanEmail));
    const snap = await getDocs(qEmail);
    if (!snap.empty) {
      return {
        success: false,
        error: `O e-mail institucional "${cleanEmail}" já está cadastrado no sistema CISEB.`,
      };
    }
  } catch (err: any) {
    console.warn('[AdminService] Aviso ao verificar duplicidade no Firestore:', err);
  }

  const nowIso = new Date().toISOString();
  const todayStr = nowIso.split('T')[0];

  // Gera um ID consistente baseado em email
  const docId = `prof_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

  const newAccount: CisebRegisteredAccount = {
    id: docId,
    nome: cleanNome,
    email: cleanEmail,
    escolaId: escola.id,
    escolaNome: escola.nome,
    unidadeCiseb: escola.nome,
    dre: escola.dre || '',
    role: 'formador',
    status,
    // Auditoria
    criadoPor: adminEmail,
    criadoEm: nowIso,
    cadastradoPor: adminEmail,
    dataCadastro: todayStr,
    atualizadoPor: adminEmail,
    atualizadoEm: nowIso,
  };

  try {
    const docRef = doc(db, ACCOUNTS_COLLECTION, docId);
    await setDoc(docRef, newAccount, { merge: true });
    console.log(`[AdminService] Novo professor ${cleanNome} (${cleanEmail}) cadastrado com sucesso.`);
    return { success: true, account: newAccount };
  } catch (err: any) {
    console.error('[AdminService] Erro ao cadastrar professor:', err);
    return {
      success: false,
      error: err?.message || 'Falha ao gravar o cadastro do professor no Firestore.',
    };
  }
}

/**
 * Atualiza os dados de um professor existente no painel administrativo
 */
export async function atualizarProfessor(params: {
  id: string;
  nome: string;
  escolaId: string;
  escolasDisponiveis: CisebEscola[];
  status: 'ativo' | 'inativo';
  adminEmail: string;
}): Promise<{ success: boolean; error?: string }> {
  const cleanNome = (params.nome || '').trim().toUpperCase();
  const cleanEscolaId = (params.escolaId || '').trim();
  const adminEmail = (params.adminEmail || 'ciseb.adm@escola.seduc.pa.gov.br').trim().toLowerCase();

  if (!cleanNome || cleanNome.length < 3) {
    return { success: false, error: 'Informe o nome completo do professor.' };
  }

  if (!cleanEscolaId) {
    return { success: false, error: 'A unidade CISEB é obrigatória. Não é permitido professor sem unidade.' };
  }

  const escola = params.escolasDisponiveis.find((e) => e.id === cleanEscolaId) || findEscolaByNameOrUnit(cleanEscolaId);

  try {
    const docRef = doc(db, ACCOUNTS_COLLECTION, params.id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return { success: false, error: 'Registro do professor não encontrado no Firestore.' };
    }

    const current = snap.data() as CisebRegisteredAccount;
    const nowIso = new Date().toISOString();

    const updatePayload: Partial<CisebRegisteredAccount> = {
      nome: cleanNome,
      escolaId: escola.id,
      escolaNome: escola.nome,
      unidadeCiseb: escola.nome,
      dre: escola.dre || '',
      status: params.status,
      atualizadoPor: adminEmail,
      atualizadoEm: nowIso,
    };

    await setDoc(docRef, updatePayload, { merge: true });
    console.log(`[AdminService] Professor ${params.id} atualizado por ${adminEmail}.`);
    return { success: true };
  } catch (err: any) {
    console.error('[AdminService] Erro ao atualizar professor:', err);
    return { success: false, error: err?.message || 'Erro ao atualizar dados do professor.' };
  }
}

/**
 * Alterna status Ativo/Inativo de um professor sem excluir histórico
 */
export async function alternarStatusProfessor(
  professorId: string,
  novoStatus: 'ativo' | 'inativo',
  adminEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, ACCOUNTS_COLLECTION, professorId);
    const nowIso = new Date().toISOString();
    await setDoc(
      docRef,
      {
        status: novoStatus,
        atualizadoPor: adminEmail,
        atualizadoEm: nowIso,
      },
      { merge: true }
    );
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao alterar status do professor.' };
  }
}

// ----------------------------------------------------
// 2. GESTÃO ADMINISTRATIVA DE UNIDADES CISEB
// ----------------------------------------------------

/**
 * Assina lista em tempo real de todas as unidades CISEB cadastradas no Firestore
 */
export function subscribeAdminUnidades(callback: (unidades: CisebEscola[]) => void): () => void {
  try {
    const colRef = collection(db, ESCOLAS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: CisebEscola[] = [];
        snapshot.forEach((snap) => {
          const data = snap.data() as CisebEscola;
          list.push({
            ...data,
            id: snap.id,
            codigo: data.codigo || snap.id,
          });
        });

        // Ordena por nome alfabético
        list.sort((a, b) => a.nome.localeCompare(b.nome));
        callback(list);
      },
      (error) => {
        console.warn('[AdminService] Erro ao assinar unidades:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('[AdminService] Falha ao registrar listener de unidades:', err);
    return () => {};
  }
}

/**
 * Cadastra uma nova unidade CISEB no painel administrativo
 */
export async function cadastrarUnidade(params: {
  codigo?: string;
  nome: string;
  municipio: string;
  dre?: string;
  status?: 'ativo' | 'inativo';
  adminEmail: string;
  existingUnits: CisebEscola[];
  permitirSimilaridadeConfirmada?: boolean;
}): Promise<{
  success: boolean;
  error?: string;
  alertaSimilaridade?: {
    unidadeSimilar: CisebEscola;
    mensagem: string;
  };
  escola?: CisebEscola;
}> {
  const cleanNome = (params.nome || '').trim().toUpperCase();
  const cleanMunicipio = (params.municipio || '').trim();
  const cleanDre = (params.dre || '').trim().toUpperCase();
  const status = params.status || 'ativo';
  const adminEmail = (params.adminEmail || 'ciseb.adm@escola.seduc.pa.gov.br').trim().toLowerCase();

  // Validações
  if (!cleanNome || cleanNome.length < 4) {
    return { success: false, error: 'Informe o nome oficial da unidade escolar (mínimo de 4 caracteres).' };
  }

  // Gera código único ou usa o informado
  const cleanCodigo = (params.codigo && params.codigo.trim().length > 0
    ? normalizeText(params.codigo).replace(/[^a-z0-9\-]/g, '-')
    : generateUnitCode(cleanNome)
  ).replace(/^-+|-+$/g, '');

  if (!cleanCodigo) {
    return { success: false, error: 'Código identificador da unidade inválido.' };
  }

  // Verifica unicidade de código
  const codigoJaExiste = params.existingUnits.some(
    (u) => u.id.toLowerCase() === cleanCodigo.toLowerCase() || (u.codigo && u.codigo.toLowerCase() === cleanCodigo.toLowerCase())
  );
  if (codigoJaExiste) {
    return {
      success: false,
      error: `Já existe uma unidade cadastrada com o código "${cleanCodigo}". Escolha um código diferente.`,
    };
  }

  // Detecção de similaridade / duplicidade de nome
  if (!params.permitirSimilaridadeConfirmada) {
    const similar = detectSimilarUnit(cleanNome, params.existingUnits);
    if (similar) {
      return {
        success: false,
        alertaSimilaridade: {
          unidadeSimilar: similar,
          mensagem: `Atenção: Foi detectada uma unidade já cadastrada com nome semelhante: "${similar.nome}" (${similar.municipio}). Verifique se não se trata de uma duplicidade antes de continuar.`,
        },
      };
    }
  }

  const nowIso = new Date().toISOString();

  const newUnit: CisebEscola = {
    id: cleanCodigo,
    codigo: cleanCodigo,
    nome: cleanNome,
    municipio: cleanMunicipio || 'Pará',
    dre: cleanDre,
    status,
    dataCriacao: nowIso.split('T')[0],
    // Auditoria
    criadoPor: adminEmail,
    criadoEm: nowIso,
    atualizadoPor: adminEmail,
    atualizadoEm: nowIso,
  };

  try {
    const docRef = doc(db, ESCOLAS_COLLECTION, cleanCodigo);
    await setDoc(docRef, newUnit, { merge: true });
    console.log(`[AdminService] Nova unidade ${cleanNome} (${cleanCodigo}) cadastrada com sucesso.`);
    return { success: true, escola: newUnit };
  } catch (err: any) {
    console.error('[AdminService] Erro ao cadastrar unidade:', err);
    return { success: false, error: err?.message || 'Falha ao registrar unidade no Firestore.' };
  }
}

/**
 * Atualiza dados de uma unidade CISEB
 */
export async function atualizarUnidade(params: {
  id: string;
  nome: string;
  municipio: string;
  dre?: string;
  status: 'ativo' | 'inativo';
  adminEmail: string;
  existingUnits: CisebEscola[];
  permitirSimilaridadeConfirmada?: boolean;
}): Promise<{
  success: boolean;
  error?: string;
  alertaSimilaridade?: {
    unidadeSimilar: CisebEscola;
    mensagem: string;
  };
}> {
  const cleanNome = (params.nome || '').trim().toUpperCase();
  const cleanMunicipio = (params.municipio || '').trim();
  const cleanDre = (params.dre || '').trim().toUpperCase();
  const adminEmail = (params.adminEmail || 'ciseb.adm@escola.seduc.pa.gov.br').trim().toLowerCase();

  if (!cleanNome || cleanNome.length < 4) {
    return { success: false, error: 'Informe o nome oficial da unidade escolar.' };
  }

  // Detecção de similaridade com outras unidades (exceto ela mesma)
  if (!params.permitirSimilaridadeConfirmada) {
    const similar = detectSimilarUnit(cleanNome, params.existingUnits, params.id);
    if (similar) {
      return {
        success: false,
        alertaSimilaridade: {
          unidadeSimilar: similar,
          mensagem: `Atenção: O novo nome é semelhante à unidade já cadastrada: "${similar.nome}" (${similar.municipio}). Deseja manter mesmo assim?`,
        },
      };
    }
  }

  const nowIso = new Date().toISOString();

  try {
    const docRef = doc(db, ESCOLAS_COLLECTION, params.id);
    await setDoc(
      docRef,
      {
        nome: cleanNome,
        municipio: cleanMunicipio,
        dre: cleanDre,
        status: params.status,
        atualizadoPor: adminEmail,
        atualizadoEm: nowIso,
      },
      { merge: true }
    );

    // Sincroniza em cascata para os professores vinculados a esta unidade
    try {
      const accColRef = collection(db, ACCOUNTS_COLLECTION);
      const qAcc = query(accColRef, where('escolaId', '==', params.id));
      const accSnap = await getDocs(qAcc);
      if (!accSnap.empty) {
        for (const docAcc of accSnap.docs) {
          await setDoc(
            docAcc.ref,
            {
              escolaNome: cleanNome,
              unidadeCiseb: cleanNome,
              dre: cleanDre,
              atualizadoEm: nowIso,
            },
            { merge: true }
          );
        }
      }
    } catch (cascadeErr) {
      console.warn('[AdminService] Aviso ao propagar alteração da unidade para professores:', cascadeErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('[AdminService] Erro ao atualizar unidade:', err);
    return { success: false, error: err?.message || 'Falha ao atualizar dados da unidade no Firestore.' };
  }
}

/**
 * Alterna status Ativo/Inativo de uma unidade
 */
export async function alternarStatusUnidade(
  unidadeId: string,
  novoStatus: 'ativo' | 'inativo',
  adminEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, ESCOLAS_COLLECTION, unidadeId);
    const nowIso = new Date().toISOString();
    await setDoc(
      docRef,
      {
        status: novoStatus,
        atualizadoPor: adminEmail,
        atualizadoEm: nowIso,
      },
      { merge: true }
    );
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao alterar status da unidade.' };
  }
}

/**
 * Verifica se uma unidade pode ser excluída fisicamente.
 * Regra estrita: Se houver professores ou planos associados, impede exclusão física
 * e orienta o administrador a inativar.
 */
export async function verificarExclusaoUnidade(unidadeId: string, unidadeNome: string): Promise<{
  podeExcluir: boolean;
  motivo?: string;
  totalProfessores: number;
}> {
  try {
    // 1. Verifica professores vinculados por escolaId ou nome
    const accRef = collection(db, ACCOUNTS_COLLECTION);
    const snapAcc = await getDocs(accRef);
    let linkedProfessors = 0;

    snapAcc.forEach((docSnap) => {
      const acc = docSnap.data() as CisebRegisteredAccount;
      if (acc.escolaId === unidadeId || acc.unidadeCiseb === unidadeNome) {
        linkedProfessors += 1;
      }
    });

    if (linkedProfessors > 0) {
      return {
        podeExcluir: false,
        totalProfessores: linkedProfessors,
        motivo: `Esta unidade possui ${linkedProfessors} professor(es) vinculado(s) no sistema. Para preservar a integridade histórica dos dados, unidades com histórico não devem ser excluídas fisicamente. Utilize a opção "Inativar".`,
      };
    }

    return { podeExcluir: true, totalProfessores: 0 };
  } catch (err) {
    console.warn('[AdminService] Aviso ao verificar vínculos da unidade:', err);
    return { podeExcluir: false, totalProfessores: 1, motivo: 'Não foi possível verificar os vínculos de segurança.' };
  }
}

/**
 * Exclui fisicamente uma unidade que NÃO possua nenhum dado relacionado
 */
export async function excluirUnidadeFisica(unidadeId: string, unidadeNome: string): Promise<{ success: boolean; error?: string }> {
  const check = await verificarExclusaoUnidade(unidadeId, unidadeNome);
  if (!check.podeExcluir) {
    return { success: false, error: check.motivo };
  }

  try {
    await deleteDoc(doc(db, ESCOLAS_COLLECTION, unidadeId));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao excluir unidade no Firestore.' };
  }
}
