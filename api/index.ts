import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' }));

const getGeminiClient = () => {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada nas variáveis de ambiente.');
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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
});

app.post('/api/gemini/generate-plan', async (req, res) => {
  try {
    const { prompt, currentPlan } = req.body;

    const ai = getGeminiClient();

    const systemInstruction = `
Você é Magda Soares (MAG), Consultora de Design Pedagógico Especialista do CISEB (Centro de Inovação e Sustentabilidade da Educação Básica do Pará - SEDUC/PA).
Seu objetivo é auxiliar Professores Formadores na elaboração, estruturação e preenchimento de Planos de Atendimento e Suporte de Prototipagem.
    `.trim();

    const userMessage = `
Dados informados até o momento pelo Formador:
${JSON.stringify(currentPlan || {}, null, 2)}

Orientação / Solicitação adicional do usuário:
"${prompt || 'Gere ou preencha um plano completo e detalhado alinhado às diretrizes do CISEB Pará com base nos campos existentes.'}"
    `.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: userMessage,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tituloSuporte: { type: Type.STRING },
            cargaHorariaAulas: { type: Type.STRING },
            modalidade: { type: Type.STRING },
            unidadeCiseb: { type: Type.STRING },
            professorFormador: { type: Type.STRING },
            temaImersao: { type: Type.STRING },
            turmaParticipante: { type: Type.STRING },
            bnccCompetencias: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            bnccHabilidadesEixo: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            odsAplicada: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            trilhaImersao: { type: Type.STRING },
            fase1Empatia: { type: Type.STRING },
            fase2TempestadeIdeias: { type: Type.STRING },
            fase3PrototipagemSolucao: { type: Type.STRING },
            tipoPrototipo: { type: Type.STRING },
            recursosDidaticosTecnologicos: { type: Type.STRING },
            roteiroPedagógico: { type: Type.STRING },
            expectativaAprendizagem: { type: Type.STRING },
          },
          required: [
            'tituloSuporte',
            'fase1Empatia',
            'fase2TempestadeIdeias',
            'fase3PrototipagemSolucao',
            'roteiroPedagógico',
          ],
        },
      },
    });

    const jsonText = response.text || '{}';
    const parsedData = JSON.parse(jsonText);

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Erro na API Gemini (generate-plan):', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Erro ao gerar o plano de suporte pedagógico com IA.',
    });
  }
});

app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, currentPlan } = req.body;

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
`;

    const conversationContext = messages
      ?.map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Formador(a)' : 'MAG'}: ${m.content}`)
      .join('\n\n') || '';

    const finalPrompt = `
[CONTEXTO DO PLANO ATUAL DO CISEB]
${JSON.stringify(currentPlan || {}, null, 2)}

[HISTÓRICO DA CONVERSA]
${conversationContext}
    `.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: finalPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({
      success: true,
      reply: response.text || 'Não foi possível gerar a resposta no momento.',
    });
  } catch (error: any) {
    console.error('Erro na API Gemini (chat):', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Erro ao comunicar com a inteligência pedagógica.',
    });
  }
});

export default app;
