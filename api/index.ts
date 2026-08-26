import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' }));

// ----------------------------------------------------
// FIREBASE ADMIN INITIALIZATION (LAZY / SAFE)
// ----------------------------------------------------
let firebaseAdminApp: App | null = null;

function getFirebaseAdmin(): App | null {
  if (firebaseAdminApp) return firebaseAdminApp;
  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseAdminApp = existingApps[0];
    return firebaseAdminApp;
  }

  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      let parsedCreds;
      try {
        parsedCreds = JSON.parse(serviceAccountKey);
      } catch {
        // Try base64 decoding if not direct JSON
        try {
          const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
          parsedCreds = JSON.parse(decoded);
        } catch {
          console.warn('[Firebase Admin] Não foi possível fazer parse do JSON de FIREBASE_SERVICE_ACCOUNT_KEY.');
        }
      }

      if (parsedCreds) {
        firebaseAdminApp = initializeApp({
          credential: cert(parsedCreds),
        });
        console.log('[Firebase Admin] Inicializado com sucesso via Service Account Key.');
        return firebaseAdminApp;
      }
    }

    // Default application credentials (GCP environment)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG) {
      firebaseAdminApp = initializeApp();
      console.log('[Firebase Admin] Inicializado com credenciais padrão do ambiente.');
      return firebaseAdminApp;
    }
  } catch (err: any) {
    console.warn('[Firebase Admin] Aviso ao inicializar Firebase Admin SDK:', err?.message || err);
  }
  return null;
}


// Generate a cryptographically strong random password for admin creation/reset
function generateServerSecurePassword(length = 14): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';

  let pwd = '';
  pwd += upper.charAt(Math.floor(Math.random() * upper.length));
  pwd += lower.charAt(Math.floor(Math.random() * lower.length));
  pwd += digits.charAt(Math.floor(Math.random() * digits.length));
  pwd += symbols.charAt(Math.floor(Math.random() * symbols.length));

  const all = upper + lower + digits + symbols;
  for (let i = 4; i < length; i++) {
    pwd += all.charAt(Math.floor(Math.random() * all.length));
  }

  // Shuffle
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

// ----------------------------------------------------
// AUTHENTICATION & ADMIN API ROUTES
// ----------------------------------------------------

/**
 * Middleware to verify Admin/Monitoramento authorization
 */
async function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If Firebase Admin isn't configured in development, allow request but log warning
    const adminApp = getFirebaseAdmin();
    if (!adminApp) {
      return next();
    }
    return res.status(401).json({ success: false, error: 'Token de autenticação não fornecido.' });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  const adminApp = getFirebaseAdmin();
  if (!adminApp) {
    return next();
  }

  try {
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (err: any) {
    console.error('[Auth Admin Middleware] Erro ao verificar token:', err);
    return res.status(403).json({ success: false, error: 'Sessão inválida ou expirada.' });
  }
}

/**
 * POST /api/admin/accounts - Create account with temporary password & custom claims
 */
app.post('/api/admin/accounts', requireAdminAuth, async (req, res) => {
  try {
    const { nome, email, unidadeCiseb, role } = req.body;
    if (!nome || !email || !unidadeCiseb) {
      return res.status(400).json({ success: false, error: 'Nome, e-mail e unidade CISEB são obrigatórios.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail.endsWith('@escola.seduc.pa.gov.br')) {
      return res.status(400).json({ success: false, error: 'O e-mail deve pertencer ao domínio @escola.seduc.pa.gov.br' });
    }

    const tempPassword = generateServerSecurePassword(14);
    const accountRole = role || 'formador';
    const accountId = `ciseb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const adminApp = getFirebaseAdmin();
    let uid = accountId;

    if (adminApp) {
      const auth = getAuth(adminApp);
      try {
        const userRecord = await auth.createUser({
          email: cleanEmail,
          password: tempPassword,
          displayName: nome.toUpperCase(),
        });
        uid = userRecord.uid;

        // Set custom claims (must change password on first login)
        await auth.setCustomUserClaims(uid, {
          role: accountRole,
          unidadeCiseb,
          mustChangePassword: true,
        });
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-exists') {
          return res.status(400).json({ success: false, error: 'Este e-mail institucional já possui cadastro no Firebase Authentication.' });
        }
        throw authErr;
      }
    }

    return res.json({
      success: true,
      account: {
        id: accountId,
        uid,
        nome: nome.toUpperCase(),
        email: cleanEmail,
        unidadeCiseb,
        role: accountRole,
        status: 'ativo',
        mustChangePassword: true,
        dataCadastro: new Date().toISOString(),
      },
      tempPassword,
    });
  } catch (error: any) {
    console.error('[Admin API] Erro ao criar conta:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erro ao processar criação de conta no servidor.' });
  }
});

/**
 * PATCH /api/admin/accounts/:id - Update account profile / unit / role
 */
app.patch('/api/admin/accounts/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, unidadeCiseb, role } = req.body;

    const adminApp = getFirebaseAdmin();
    if (adminApp) {
      const auth = getAuth(adminApp);
      try {
        // Update display name if user exists in auth
        await auth.updateUser(id, {
          displayName: nome ? nome.toUpperCase() : undefined,
        }).catch(() => {});

        // Update custom claims
        if (role || unidadeCiseb) {
          const user = await auth.getUser(id).catch(() => null);
          if (user) {
            const currentClaims = user.customClaims || {};
            await auth.setCustomUserClaims(id, {
              ...currentClaims,
              ...(role ? { role } : {}),
              ...(unidadeCiseb ? { unidadeCiseb } : {}),
            });
          }
        }
      } catch (e) {
        console.warn('[Admin API] Aviso ao sincronizar com Auth:', e);
      }
    }

    return res.json({ success: true, message: 'Conta atualizada com sucesso.' });
  } catch (error: any) {
    console.error('[Admin API] Erro ao atualizar conta:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erro ao atualizar dados da conta.' });
  }
});

/**
 * POST /api/admin/accounts/:id/reset-password - Reset password and issue new temporary password
 */
app.post('/api/admin/accounts/:id/reset-password', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const tempPassword = generateServerSecurePassword(14);

    const adminApp = getFirebaseAdmin();
    let resetLink: string | undefined = undefined;

    if (adminApp) {
      const auth = getAuth(adminApp);
      try {
        // Update user password and set mustChangePassword flag
        await auth.updateUser(id, {
          password: tempPassword,
        });

        const user = await auth.getUser(id);
        const currentClaims = user.customClaims || {};
        await auth.setCustomUserClaims(id, {
          ...currentClaims,
          mustChangePassword: true,
        });

        if (email || user.email) {
          resetLink = await auth.generatePasswordResetLink(email || user.email!);
        }
      } catch (err: any) {
        console.warn('[Admin API] Aviso ao redefinir no Firebase Auth:', err?.message || err);
      }
    }

    return res.json({
      success: true,
      tempPassword,
      resetLink,
      message: 'Senha redefinida com sucesso. O educador deverá alterá-la no próximo acesso.',
    });
  } catch (error: any) {
    console.error('[Admin API] Erro ao redefinir senha:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erro ao redefinir senha do usuário.' });
  }
});

/**
 * DELETE /api/admin/accounts/:id - Remove user from Firebase Auth
 */
app.delete('/api/admin/accounts/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const adminApp = getFirebaseAdmin();
    if (adminApp) {
      const auth = getAuth(adminApp);
      try {
        await auth.deleteUser(id);
      } catch (err: any) {
        console.warn('[Admin API] Aviso ao excluir usuário do Firebase Auth:', err?.message || err);
      }
    }

    return res.json({ success: true, message: 'Usuário removido com sucesso.' });
  } catch (error: any) {
    console.error('[Admin API] Erro ao excluir conta:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erro ao excluir conta do sistema.' });
  }
});


// ----------------------------------------------------
// GEMINI AI PEDAGOGICAL ENGINE
// ----------------------------------------------------

const getGeminiApiKey = (): string => {
  const envVars = process.env;
  return (
    envVars.GEMINI_API_KEY ||
    envVars['GEMINI-KEY'] ||
    envVars['GEMINI_KEY'] ||
    envVars.GEMINI_KEY ||
    envVars['gemini-key'] ||
    envVars.API_KEY ||
    Object.entries(envVars).find(([k, v]) => k.toUpperCase().includes('GEMINI') && typeof v === 'string' && v.trim().length > 5)?.[1] ||
    ''
  ).trim();
};

const getGeminiClient = () => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Chave da API Gemini não encontrada. Configure GEMINI_API_KEY no menu de segredos.');
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

async function generateWithFallback(ai: GoogleGenAI, params: { contents: any; config?: any }) {
  const candidateModels = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
  ];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      console.warn(`[Gemini] Tentativa com o modelo ${model} falhou:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError;
}

// ----------------------------------------------------
// PEDAGOGICAL KNOWLEDGE BASE & RESILIENT FALLBACK ENGINE
// ----------------------------------------------------

function buildPedagogicalFallbackPlan(currentPlan: any, prompt: string) {
  const unidade = currentPlan?.unidadeCiseb || 'CISEB Regional';
  const tema = currentPlan?.temaImersao || currentPlan?.tituloSuporte || 'Inovação e Sustentabilidade na Educação Básica';
  const turma = currentPlan?.turmaParticipante || 'Ensino Fundamental / Médio';
  const ods = (currentPlan?.odsAplicada && currentPlan.odsAplicada.length > 0) ? currentPlan.odsAplicada.join(', ') : 'ODS 4 (Educação de Qualidade), ODS 11 (Cidades Sustentáveis)';
  const bncc = (currentPlan?.bnccHabilidadesEixo && currentPlan.bnccHabilidadesEixo.length > 0) ? currentPlan.bnccHabilidadesEixo.join('; ') : 'Pensamento Computacional, Cultura Digital e Mundo Digital';
  const trilha = currentPlan?.trilhaImersao || 'Trilha de Prototipagem Amazônica';

  return {
    tituloSuporte: currentPlan?.tituloSuporte || `Suporte Maker: ${tema}`,
    temaImersao: currentPlan?.temaImersao || tema,
    cargaHorariaAulas: currentPlan?.cargaHorariaAulas || '4 Aulas (Sessão de Imersão Maker)',
    turmaParticipante: turma,
    fase1Empatia: `[Fase 1 - Empatia e Diagnóstico Local]: Investigação de desafios reais na comunidade escolar vinculada ao ${unidade}. Os estudantes exploram o tema "${tema}" com foco em ${ods}. Levantamento de evidências por meio de mapas de empatia, entrevistas qualitativas e observação direta do território escolar para identificação de dores e oportunidades socioambientais.`,
    fase2TempestadeIdeias: `[Fase 2 - Ideação e Modelagem Conceitual]: Brainstorming colaborativo mediado por metodologias ativas e computação criativa (${bncc}). Formulação de hipóteses de solução integradas à ${trilha}, seleção de tecnologias adequadas (sensores, placas programáveis ou materiais recicláveis regionais) e elaboração de fluxogramas e esboços conceituais da solução.`,
    fase3PrototipagemSolucao: `[Fase 3 - Prototipagem e Testes Práticos]: Construção física e lógica do protótipo no laboratório do ${unidade}. Integração de circuitos eletrônicos, blocos de programação e modelagem com reaproveitamento de materiais. Testes de usabilidade e bancada, validação em ciclos de iteração e apresentação dos resultados pelos estudantes.`,
    recursosDidaticosTecnologicos: currentPlan?.recursosDidaticosTecnologicos || 'Kit de Prototipagem Eletrônica/Robótica, Placas microcontroladoras, Ferramental Maker, Materiais recicláveis regionais, Computadores com ambiente de programação em blocos.',
    roteiroPedagógico: currentPlan?.roteiroPedagógico || '1. Acolhimento e contextualização do problema (15min); 2. Dinâmica de Empatia e levantamento de hipóteses (25min); 3. Tempestade de ideias e desenho do protótipo (30min); 4. Construção prática e programação mão na massa (80min); 5. Apresentação em banca de compartilhamento e reflexão formativa (30min).',
    expectativaAprendizagem: currentPlan?.expectativaAprendizagem || `Desenvolver a autonomia investigativa, o raciocínio algorítmico e a consciência socioambiental dos estudantes de ${turma}, capacitando-os a projetar soluções tecnológicas alinhadas às diretrizes curriculares do Pará (DCE-PA / PEDIP-PA).`,
    publicoAlvoDetalhamento: currentPlan?.publicoAlvoDetalhamento || `Estudantes e professores da rede estadual participantes das ações formativas no ${unidade}.`,
  };
}

function buildPedagogicalFallbackChat(messages: any[], currentPlan: any) {
  const lastUserMsg = (messages[messages.length - 1]?.content || '').toLowerCase();
  const unidade = currentPlan?.unidadeCiseb || '';
  const tema = currentPlan?.temaImersao || currentPlan?.tituloSuporte || '';
  const turma = currentPlan?.turmaParticipante || '';
  const bncc = (currentPlan?.bnccHabilidadesEixo || []).join(', ');
  const ods = (currentPlan?.odsAplicada || []).join(', ');

  const hasBasicData = Boolean(tema && (unidade || turma || bncc || ods));
  const fase1 = currentPlan?.fase1Empatia?.trim();
  const fase2 = currentPlan?.fase2TempestadeIdeias?.trim();
  const fase3 = currentPlan?.fase3PrototipagemSolucao?.trim();

  // If user specifically asked about Empatia or if basic data is ready and Fase 1 is empty:
  if (lastUserMsg.includes('empatia') || (!fase1 && hasBasicData)) {
    return `Para a **Fase 1 (Empatia)** sobre **${tema || 'o tema escolhido'}**, preparei 2 alternativas alinhadas à realidade do Pará e à cultura maker:

1. **Cartografia Afetiva Socioambiental:** A turma mapeia o entorno da escola ou do território do ${unidade || 'CISEB'}, fotografando e registrando em post-its os pontos críticos de problemas socioambientais locais.
2. **Entrevistas Rápidas e Matriz CSD:** Grupos de estudantes entrevistam servidores da escola ou moradores para elencar Certezas, Suposições e Dúvidas sobre os desafios de "${tema}".

Qual dessas 2 alternativas você prefere para a sua turma, ou quer combinar elementos das duas?`;
  }

  // If Fase 1 is filled and Fase 2 is not, or user asks about ideação:
  if (lastUserMsg.includes('ideação') || lastUserMsg.includes('ideacao') || (fase1 && !fase2 && hasBasicData)) {
    return `Excelente! Com a etapa de Empatia definida, para a **Fase 2 (Ideação)** sugiro duas dinâmicas produtivas:

1. **Crazy 8s Maker:** Cada estudante desenha 8 ideias rápidas de solução em 8 minutos, priorizando o uso sustentável de recursos locais e tecnológicos.
2. **Matriz de Impacto com Fluxograma Lógico:** A turma elege as soluções mais viáveis e esquematiza o algoritmo/fluxo de funcionamento da ideia conectando à BNCC Computação.

Quais recursos maker (placas, sensores, reaproveitamento) você tem disponíveis na sua unidade para essa etapa?`;
  }

  // If Fases 1 & 2 are filled and Fase 3 is not, or user asks about prototipagem:
  if (lastUserMsg.includes('prototipagem') || lastUserMsg.includes('protótipo') || (fase1 && fase2 && !fase3 && hasBasicData)) {
    return `Perfeito! Chegamos na **Fase 3 (Prototipagem)**. Pensando no espaço maker do CISEB e no tema trabalhado, veja duas opções:

1. **Protótipo Automatizado em Bancada:** Montagem em blocos de programação e microcontroladores (ex: sensores de umidade, luz ou movimento) simulando o sistema real.
2. **Maquete Funcional com Materiais Regionais:** Criação de estrutura física com materiais de reaproveitamento amazônico e automação com circuitos simples.

Qual é o nível de familiaridade da turma com esses componentes e qual o tempo disponível para a montagem?`;
  }

  // When form has few data:
  if (!hasBasicData) {
    if (tema) {
      return `Vi que você selecionou o tema **"${tema}"**.

Qual é o principal desafio real que você quer que os estudantes investiguem e resolvam nessa sessão?`;
    }
    return `Olá! Estou pronta para te apoiar como parceira de planejamento pedagógico no CISEB.

Para começarmos a desenhar essa experiência: qual é o tema central ou desafio da realidade paraense que você pretende trabalhar com sua turma?`;
  }

  // If all 3 phases are already filled:
  if (fase1 && fase2 && fase3) {
    return `Seu roteiro das 3 fases do Design Thinking já está muito bem desenhado!

Você gostaria de sugestões para os **recursos didáticos e tecnológicos** no laboratório ou prefere definir a **estratégia de avaliação e compartilhamento (pitch)** dos estudantes?`;
  }

  return `Analisando seu plano para **${tema || 'a sessão'}**, como você gostaria de iniciar o diagnóstico da **Fase 1 (Empatia)**? Deseja que eu te apresente 2 alternativas de dinâmicas práticas?`;
}

// API Health
app.get('/api/health', (req, res) => {
  const envVars = process.env;
  const hasKey = !!(
    envVars.GEMINI_API_KEY ||
    envVars['GEMINI-KEY'] ||
    envVars['GEMINI_KEY'] ||
    envVars.GEMINI_KEY ||
    envVars.API_KEY ||
    Object.entries(envVars).find(([k, v]) => k.toUpperCase().includes('GEMINI') && typeof v === 'string' && v.trim().length > 5)
  );
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: hasKey,
    hasFirebaseAdmin: !!getFirebaseAdmin(),
  });
});

// AI Plan Generation & Refinement Endpoint
app.post('/api/gemini/generate-plan', async (req, res) => {
  const { prompt, currentPlan } = req.body;
  try {
    const ai = getGeminiClient();

    const systemInstruction = `
Você é Magda Soares (MAG), Consultora de Design Pedagógico Especialista do CISEB (Centro de Inovação e Sustentabilidade da Educação Básica do Pará - SEDUC/PA).
Seu objetivo é auxiliar Professores Formadores na elaboração, estruturação e preenchimento de Planos de Atendimento e Suporte de Prototipagem.

Diretrizes Obrigatórias:
1. Alinhamento rigoroso com as escolhas feitas pelo Formador nas 3 primeiras opções:
   - OPÇÃO 1 (Identificação & Unidade): Modalidade, Unidade CISEB e Professor Formador.
   - OPÇÃO 2 (Planejamento & Tema): Tema da Imersão, Título do Suporte, Carga Horária e Turma/Público.
   - OPÇÃO 3 (Alinhamento Pedagógico): Competências da BNCC Computação, Eixos de Habilidades, ODS Aplicada e Trilha das Imersões.
2. Quando solicitado a redigir ou gerar as Fases do Design Thinking (fase1Empatia, fase2TempestadeIdeias, fase3PrototipagemSolucao):
   - Fase 1 (Empatia): Contextualize o problema e as dores da comunidade escolar/local na região da Unidade CISEB indicada, conectando à ODS e Trilha selecionadas na Opção 3.
   - Fase 2 (Ideação / Tempestade de Ideias): Estruture o brainstorming criativo, formulação de hipóteses e estratégias tecnológicas com base no Eixo da BNCC Computação e no Tema da Opção 2.
   - Fase 3 (Prototipagem da Solução): Detalhe a construção prática maker/digital da solução (circuitos, blocos, protótipo físico/automatizado) a ser desenvolvida no espaço CISEB pelos alunos da Turma indicada.
3. Alinhamento com o Referencial Curricular de Computação do Pará (DCE-PA e PEDIP-PA).
4. A resposta DEVE ser um objeto JSON estritamente válido preenchendo ou aprimorando todos os campos pedagógicos solicitados.
`.trim();

    const userMessage = `
Dados informados até o momento pelo Formador:
${JSON.stringify(currentPlan || {}, null, 2)}

Orientação / Solicitação adicional do usuário:
"${prompt || 'Gere ou preencha um plano completo e detalhado alinhado às diretrizes do CISEB Pará com base nos campos existentes.'}"
`.trim();

    const response = await generateWithFallback(ai, {
      contents: userMessage,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(text);
    } catch {
      parsedData = { rawResponse: text };
    }

    return res.json({ success: true, plan: parsedData });
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const hasKey = !!getGeminiApiKey();
    console.warn(`[Gemini Plan Fallback] Utilizando motor pedagógico offline CISEB.
  → Modelos tentados: ['gemini-2.5-flash-lite', 'gemini-2.5-flash']
  → Chave GEMINI_API_KEY configurada: ${hasKey}
  → Erro capturado: ${errorMsg}`);
    const fallbackPlan = buildPedagogicalFallbackPlan(currentPlan, prompt || '');
    return res.json({
      success: true,
      plan: fallbackPlan,
      isFallback: true,
      fallbackReason: errorMsg,
      notice: 'Plano sintetizado pela base de conhecimento pedagógico do CISEB.',
    });
  }
});

// AI Chat Pedagogical Assistant - MAG (Magda Soares)
app.post('/api/gemini/chat', async (req, res) => {
  const { messages, currentPlan } = req.body;
  try {
    const ai = getGeminiClient();

    const systemInstruction = `
Você é MAG (Magda Soares), mentora pedagógica especialista do CISEB — Centro de
Inovação e Sustentabilidade da Educação Básica do Pará (SEDUC/PA).

## SEU PAPEL
Você é uma parceira de planejamento, não uma geradora de planos prontos.
Seu trabalho é fazer PERGUNTAS INTELIGENTES, APRESENTAR ALTERNATIVAS e AJUDAR
O PROFESSOR A TOMAR DECISÕES — nunca entregar um plano completo sem ser pedido.

## COMO VOCÊ DEVE RESPONDER

### Quando o formulário tiver dados das etapas 1, 2 e 3 preenchidos:
Analise o que está preenchido (unidade, tema, modalidade, BNCC, ODS, trilha) e
apresente APENAS alternativas para a PRÓXIMA decisão do professor, nesta ordem:

1. Se Fase 1 (Empatia) ainda não foi preenchida:
   → Apresente 2 alternativas de abordagem para Empatia, adequadas ao tema e à
     realidade amazônica/Pará. Cada alternativa em 2-3 linhas.
   → Pergunte qual o professor prefere ou se quer combinar elementos das duas.

2. Se Fase 1 preenchida mas Fase 2 (Ideação) não:
   → Apresente 2 alternativas de dinâmica de ideação coerentes com a Fase 1 escolhida.
   → Pergunte sobre recursos disponíveis na unidade (se não informado).

3. Se Fases 1 e 2 preenchidas mas Fase 3 (Prototipagem) não:
   → Sugira 2 tipos de protótipo compatíveis com o tema e com os recursos do CISEB.
   → Pergunte sobre o nível da turma e tempo disponível.

### Quando o formulário tiver POUCOS dados:
Faça UMA pergunta objetiva para avançar — não liste tudo de uma vez.
Exemplo: "Vi que você selecionou o tema X. Qual é o principal desafio que você
quer que os estudantes resolvam com esse tema?"

### NUNCA:
- Gere um plano completo (Fases 1, 2 e 3) sem o professor pedir explicitamente
- Repita os dados do formulário de volta ao professor como se fosse uma confirmação
- Use frases genéricas como "Com base na sua seleção..." seguidas de um plano pronto
- Ofereça mais de 2 alternativas por vez

### FORMATO DAS RESPOSTAS:
- Máximo 200 palavras por resposta
- Use markdown leve (negrito para nomes de técnicas, listas curtas)
- Termine sempre com UMA pergunta ou UMA ação clara para o professor
- Tom: próxima, direta, entusiasmada — como uma colega especialista

## CONTEXTO DO PROJETO CISEB
- Metodologia: Design Thinking (Empatia → Ideação → Prototipagem)
- Foco: cultura maker, BNCC Computação, sustentabilidade amazônica, DCE-PA
- Perfil dos professores: formadores experientes que precisam de apoio pontual,
  não de tutoriais básicos
- As unidades têm espaços maker com microcontroladores, impressoras 3D,
  materiais de reaproveitamento
`.trim();

    const chatContent = (messages || []).map((m: any) => `${m.role === 'user' ? 'Professor Formador' : 'MAG (Magda Soares)'}: ${m.content}`).join('\n\n');

    const promptText = `
Contexto das Opções da Ficha de Atendimento em edição no momento:
${JSON.stringify(currentPlan || {}, null, 2)}

Histórico do Diálogo com o Formador:
${chatContent}
`.trim();

    const response = await generateWithFallback(ai, {
      contents: promptText,
      config: {
        systemInstruction,
      },
    });

    return res.json({
      success: true,
      reply: response.text || 'Não foi possível gerar a resposta no momento.',
    });
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const hasKey = !!getGeminiApiKey();
    console.warn(`[Gemini Chat Fallback] Utilizando motor de orientação pedagógica MAG (fallback CISEB).
  → Modelos tentados: ['gemini-2.5-flash-lite', 'gemini-2.5-flash']
  → Chave GEMINI_API_KEY configurada: ${hasKey}
  → Erro capturado: ${errorMsg}`);
    const fallbackReply = buildPedagogicalFallbackChat(messages || [], currentPlan || {});
    return res.json({
      success: true,
      reply: fallbackReply,
      isFallback: true,
      fallbackReason: errorMsg,
    });
  }
});

export default app;
