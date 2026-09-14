export interface CisebSessionPlan {
  id: string;
  createdAt: string;
  updatedAt: string;

  // Autoria e Propriedade do Plano
  createdBy?: string; // ID do usuário criador (uid)
  authorEmail?: string; // E-mail institucional do autor
  authorNome?: string; // Nome do professor formador criador
  
  // 1. Modalidade de Atendimento
  modalidade: string;
  
  // 2. Unidade CISEB
  unidadeCiseb: string;
  
  // 3. Professor(a) Formador(a)
  professorFormador: string;
  
  // 4. Tema de Imersão
  temaImersao: string;
  
  // 5. Informações Gerais
  tituloSuporte: string;
  cargaHorariaAulas: string; // e.g., "4 aulas (4h)"
  turmaParticipante: string; // "Atendimentos", "Fixa", "Itinerância"
  
  // 6. Alinhamento Pedagógico
  bnccCompetencias: string[]; // Competências BNCC Computação
  bnccHabilidadesEixo: string[]; // Eixos BNCC
  odsAplicada: string[]; // ODS
  trilhaImersao: string; // Trilha temática
  
  // 7. Etapas Metodológicas (Design Thinking)
  fase1Empatia: string;
  fase2TempestadeIdeias: string;
  fase3PrototipagemSolucao: string;
  
  // 8. Detalhes de Execução Técnica
  tipoPrototipo: string; // Físico, Digital, 3D, Automatizado, IA, Outros
  recursosDidaticosTecnologicos: string;
  roteiroPedagógico: string; // Passo a passo da construção
  expectativaAprendizagem: string;

  // Additional context / observations
  publicoAlvoDetalhamento?: string;
  observacoes?: string;
}

export const MODALIDADES_OPTIONS = [
  'Imersão para Estudantes',
  'Formação de Professores',
  'Mentoria',
  'Visita Técnica',
  'Itinerância',
  'Turmas Fixas',
] as const;

export const UNIDADES_CISEB_OPTIONS = [
  'CISEB EE AUGUSTO MEIRA',
  'CISEB EE BARÃO DO RIO BRANCO',
  'CISEB EE CELSO RODRIGUES',
  'CISEB EE COMANDANTE LAURINDO CANDIDO AZEITONA',
  'CISEB EE DR FÁBIO LUZ - SANTA IZABEL DO PARÁ/TOMÉ AÇU',
  'CISEB EE DR GASPAR VIANA - MARABÁ',
  'CISEB EE DR JUSTO CHERMONT',
  'CISEB EE ERIBERTO JASPER',
  'CISEB EE DR ROMILDO VELOSO E SILVA - XINGUARA/OURILÂNDIA DO NORTE',
  'CISEB EE IZIDORIO FRANCISCO DE SOUZA',
  'CISEB EE JOSE DE ALENCAR',
  'CISEB EE MACÁRIO DANTAS',
  'CISEB EE MARECHAL CORDEIRO DE FARIAS',
  'CISEB EE MARIA DAS GRACAS BALBINO CORREA',
  'CISEB EE MESTRA IDALINA RODRIGUES PEREIRA',
  'CISEB EE PAULINO DE BRITO - PORTEL/BREVES',
  'CISEB EE PEDRO AMAZONAS PEDROSO',
  'CISEB EE PEQUENO PRINCÍPE',
  'CISEB EE PROFA MARTA DA CONCEICAO',
  'CISEB EE RUY PARANATINGA BARATA',
] as const;

export const PROFESSORES_FORMADORES_OPTIONS = [
  'ALESSANDRA MUHKINA JASTES GONCALVES',
  'ALEXANDRE DE QUEIROZ MENDES',
  'ANNY NAYARA SILVA LOPES',
  'AYVANIA ALVES PINTO',
  'CARLOS ALBERTO BRITO DE SOUZA',
  'CARLOS ALBERTO DA CRUZ VIANA JUNIOR',
  'DILSON DOS SANTOS AIRES',
  'ELIEZER LOPES MENEZES FILHO',
  'FABIO JORGE DE NAZARE FERREIRA',
  'FELIPE DE AVIZ BATISTA',
  'FERNANDO EMANUEL CARDOSO PEREIRA',
  'HERICTON JOAO DA COSTA RAIOL',
  'HERMISON BRUNO BAIA PALHETA',
  'IONE MARIA CAMARA DA SILVA',
  'IVANESSA SOLON SILVEIRA',
  'JACQUELINE FERNANDES DE SÁ XAVIER',
  'JAIRO LEITE BARBOSA',
  'JAQUELINE MENDES GONCALVES',
  'JOHN ALLEF ALVES VIEIRA',
  'JOSUE MOREIRA DE SOUZA',
  'LENNON MARTINS PEREIRA',
  'LUANA FRANÇA CALANDRINI DE AZEVEDO',
  'LUCIANA DA FONSECA',
  'MARCELLE ROLIM DE SOUZA LIMA',
  'MARCELO DE LIMA LOPES',
  'MARCUS VINICIUS MOURA DE OLIVEIRA',
  'MARIA ELIANE DE OLIVEIRA',
  'MARLON PANTOJA CORREA',
  'MONICA LORENA MOREIRA',
  'MONICA SELENE GONÇALVES',
  'TAIANE NOVAES DO CARMO',
  'THIAGO MIRANDA COSTA',
  'WANDERSON ALVES MONTEIRO',
] as const;

export const TEMAS_IMERSAO_OPTIONS = [
  'Cultura Digital',
  'Realidade Virtual e Aumentada',
  'Cultura Maker',
  'Inteligência Artificial',
  'Programação Criativa',
  'Prototipagem e Fabricação Digital',
  'Robótica e Modelagem',
] as const;

export const TURMA_PARTICIPANTE_OPTIONS = [
  'Atendimentos',
  'Fixa',
  'Itinerância',
] as const;

export const BNCC_COMPETENCIAS_OPTIONS = [
  'Compreensão do Mundo Digital',
  'Pensamento Computacional',
  'Uso Crítico e Ético da Tecnologia',
  'Criação e Autoria Digital',
  'Cidadania Digital',
] as const;

export const BNCC_EIXOS_HABILIDADES_OPTIONS = [
  'Pensamento Computacional',
  'Mundo Digital',
  'Cultura Digital',
] as const;

export const ODS_OPTIONS = [
  'ODS 04 - Educação de Qualidade',
  'ODS 09 - Indústria e Inovação',
  'ODS 11 - Cidades Sustentáveis',
  'ODS 12 - Consumo Responsável',
  'ODS 13 - Ação Climática',
] as const;

export const TRILHAS_IMERSAO_OPTIONS = [
  'Reciclagem e Resíduos Sólidos',
  'Reflorestamento e Recomposição Vegetação Nativa',
  'Clima e Mudança Climática',
  'Combate à Violência contra a Mulher',
  'Antirracismo',
] as const;

export const TIPO_PROTOTIPO_OPTIONS = [
  'Físico',
  'Digital',
  'Automatizado',
  'Outros',
] as const;

/**
 * URL Oficial Externa da Assistente Pedagógica MAG (CISEB / SEDUC-PA)
 */
export const DEFAULT_MAG_EXTERNAL_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAG_EXTERNAL_URL) ||
  'https://gemini.google.com/gem/1miSU2iNW3sYwrsHDlsTacGy43YmQpLOP?usp=sharing';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isFallback?: boolean;
  fallbackReason?: string;
}

export interface CisebEscola {
  id: string; // Ex: 'ciseb-augusto-meira'
  codigo?: string; // Código único da unidade
  nome: string; // Ex: 'CISEB - EE AUGUSTO MEIRA'
  municipio: string; // Ex: 'Belém'
  status: 'ativo' | 'inativo';
  endereco?: string;
  telefone?: string;
  dataCriacao?: string;
  // Auditoria
  criadoPor?: string;
  criadoEm?: string;
  atualizadoPor?: string;
  atualizadoEm?: string;
}

export interface AuthUser {
  id: string;
  uid?: string;
  nome: string;
  email: string;
  role: 'formador' | 'coordenador' | 'tecnico' | 'monitoramento' | 'visitante';
  escolaId?: string;
  escolaNome?: string;
  unidadeCiseb?: string;
  matricula?: string;
  avatarUrl?: string;
  ultimoAcesso: string;
}

export interface CisebRegisteredAccount {
  id: string;
  uid?: string;
  nome: string;
  escolaId: string;
  escolaNome?: string;
  unidadeCiseb: string;
  email: string;
  role: 'formador' | 'coordenador' | 'monitoramento';
  status: 'ativo' | 'inativo';
  cadastradoPor: string;
  dataCadastro: string;
  // Auditoria
  criadoPor?: string;
  criadoEm?: string;
  atualizadoPor?: string;
  atualizadoEm?: string;
  primeiroAcessoEm?: string;
  ultimoAcessoEm?: string;
}

/**
 * Verifica se um plano pertence estritamente ao usuário autenticado atual.
 * Compara por ID do autor, e-mail institucional ou nome do professor formador.
 */
export function isPlanOwnedByUser(plan: CisebSessionPlan, user: AuthUser | null): boolean {
  if (!user) return false;

  // 1. Verificação por ID de usuário / UID do Firebase
  if (plan.createdBy && (plan.createdBy === user.id || (user.uid && plan.createdBy === user.uid))) {
    return true;
  }

  // 2. Verificação por E-mail institucional do autor
  if (plan.authorEmail && user.email && plan.authorEmail.trim().toLowerCase() === user.email.trim().toLowerCase()) {
    return true;
  }

  // 3. Verificação por nome do autor
  if (plan.authorNome && user.nome && plan.authorNome.trim().toLowerCase() === user.nome.trim().toLowerCase()) {
    return true;
  }

  // 4. Fallback de compatibilidade: se o plano foi salvo antes sem createdBy/authorEmail,
  // compara com o campo professorFormador se for idêntico ao nome do usuário logado
  if (
    !plan.createdBy &&
    !plan.authorEmail &&
    plan.professorFormador &&
    user.nome &&
    plan.professorFormador.trim().toLowerCase() === user.nome.trim().toLowerCase()
  ) {
    return true;
  }

  return false;
}

/**
 * Prazo de retenção automática dos planos (1 semana / 7 dias).
 * Após 7 dias da última edição/salvamento, o plano é expirado e excluído para evitar acúmulo de cache.
 */
export const PLAN_RETENTION_DAYS = 7;

/**
 * Retorna se o plano já ultrapassou o período de retenção de 7 dias
 */
export function isPlanExpired(plan: CisebSessionPlan): boolean {
  const dateStr = plan.updatedAt || plan.createdAt;
  if (!dateStr) return false;
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return false;
  const diffDays = (Date.now() - time) / (1000 * 60 * 60 * 24);
  return diffDays > PLAN_RETENTION_DAYS;
}

/**
 * Retorna os dias restantes para expiração do plano (0 a 7 dias)
 */
export function getPlanDaysRemaining(plan: CisebSessionPlan): number {
  const dateStr = plan.updatedAt || plan.createdAt;
  if (!dateStr) return PLAN_RETENTION_DAYS;
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return PLAN_RETENTION_DAYS;
  const elapsedDays = (Date.now() - time) / (1000 * 60 * 60 * 24);
  const remaining = Math.ceil(PLAN_RETENTION_DAYS - elapsedDays);
  return Math.max(0, remaining);
}



