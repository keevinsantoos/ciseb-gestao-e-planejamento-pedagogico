import React, { useState } from 'react';
import { ChatMessage, CisebSessionPlan } from '../types';
import { Sparkles, Send, X, Bot, User, RefreshCw, Lightbulb, RotateCcw, AlertTriangle } from 'lucide-react';
import Markdown from 'react-markdown';
import magAvatar from '../assets/images/mag_avatar_v2_1786994402829.jpg';

interface AiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  plan: CisebSessionPlan;
  onApplyPlanUpdate: (partialPlan: Partial<CisebSessionPlan>) => void;
}

const INITIAL_MAG_PRESENTATION = `Olá, professor(a) formador(a)! Que alegria ter você aqui! 👋✨

Eu sou a **MAG** (*Magda Soares*), sua mentora e parceira no planejamento pedagógico para o **CISEB por Todo o Pará**.

Meu propósito é caminhar ao seu lado na construção de experiências de aprendizagem memoráveis, que conectem a **cultura maker**, a **investigação científica**, a **sustentabilidade amazônica** e os eixos da **BNCC Computação e DCE-PA**.

Para começarmos a desenhar essa proposta a quatro mãos, me conta:

1. **Qual é o tema central ou desafio** que você gostaria de explorar nessa sessão?
2. **Qual é a turma/etapa** participante e a **unidade do CISEB** onde a ação vai acontecer?

Vamos construir passo a passo, garantindo que o plano tenha a sua autoria e a realidade dos seus estudantes! Por onde quer começar? 🚀🌿`;

export const AiCopilotDrawer: React.FC<AiCopilotDrawerProps> = ({
  isOpen,
  onClose,
  plan,
  onApplyPlanUpdate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial-mag',
      role: 'assistant',
      content: INITIAL_MAG_PRESENTATION,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check completion of Options 1, 2 and 3
  const isOption1Filled = Boolean(plan.unidadeCiseb || plan.modalidade || plan.professorFormador);
  const isOption2Filled = Boolean(plan.temaImersao || plan.tituloSuporte || plan.turmaParticipante);
  const isOption3Filled = Boolean(
    (plan.bnccCompetencias && plan.bnccCompetencias.length > 0) ||
    (plan.bnccHabilidadesEixo && plan.bnccHabilidadesEixo.length > 0) ||
    (plan.odsAplicada && plan.odsAplicada.length > 0) ||
    plan.trilhaImersao
  );
  const areOptions123Ready = isOption1Filled && isOption2Filled && isOption3Filled;

  if (!isOpen) return null;

  const handleResetChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: INITIAL_MAG_PRESENTATION,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleOrientPhases123 = () => {
    const prompt = `MAG, preenchi a identificação, o tema "${plan.temaImersao || plan.tituloSuporte || 'do projeto'}" e o alinhamento pedagógico na minha Ficha de Atendimento.

Como podemos iniciar a Fase 1 (Empatia)? Quais alternativas de abordagem você sugere para a nossa realidade?`;
    handleSend(prompt);
  };

  const handleSend = async (userPromptText?: string) => {
    const query = userPromptText || input;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userPromptText) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          currentPlan: plan,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFallback: Boolean(data.isFallback),
          fallbackReason: data.fallbackReason,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(data.error || 'Falha ao processar resposta.');
      }
    } catch (err: any) {
      const errorMsg = err?.message || '';
      let feedback = 'Desculpe, ocorreu uma instabilidade na comunicação com o assistente pedagógico.';
      if (
        errorMsg.includes('PERMISSION_DENIED') ||
        errorMsg.includes('denied access') ||
        errorMsg.includes('403')
      ) {
        feedback = `⚠️ **Aviso de Permissão da Chave de API (HTTP 403 / PERMISSION_DENIED)**:\n\nA chave configurada no momento retornou que o projeto não possui permissão de acesso à API Gemini (ex: chave restrita a outra API ou projeto sem a Generative Language API ativada no Google Cloud Console).\n\n**Como solucionar:**\n1. Acesse o [Google AI Studio](https://aistudio.google.com/app/apikey) com sua conta Google.\n2. Crie ou copie uma nova API Key válida.\n3. Insira-a no menu **Settings > Secrets / Environment Variables** com o nome \`GEMINI_API_KEY\`.`;
      } else if (
        errorMsg.includes('GEMINI_API_KEY') ||
        errorMsg.includes('API key') ||
        errorMsg.includes('400') ||
        errorMsg.includes('unregistered')
      ) {
        feedback = `⚠️ **Aviso de Configuração da Chave da API Gemini**:\n\n${errorMsg || 'A chave da API Gemini informada precisa ser configurada.'}\n\n👉 Para ativar, adicione sua chave válida no menu de configurações do AI Studio (Secrets / Environment Variables) com o nome \`GEMINI_API_KEY\`.`;
      } else if (errorMsg) {
        feedback = `⚠️ **Aviso**: ${errorMsg}`;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: feedback,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Quais alternativas você sugere para a Fase 1 (Empatia)?',
    'Como conduzir a dinâmica de ideação na Fase 2?',
    'Ideias de prototipagem maker para a Fase 3',
    'Como conectar este tema com a BNCC Computação?',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-[440px] bg-white shadow-2xl border-l border-slate-200 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#005BAC] to-[#013780] text-white p-4 flex items-center justify-between border-b border-[#012b66]">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-2 border-amber-300 ring-2 ring-white/30 shrink-0 bg-sky-900">
            <img
              src={magAvatar}
              alt="MAG - Magda Soares Avatar"
              className="w-full h-full object-cover object-top scale-115"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h3 className="font-black text-base text-white flex items-center gap-1.5 tracking-tight">
              MAG <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Magda Soares</span>
            </h3>
            <p className="text-xs text-sky-100 font-medium">Mentoria Pedagógica CISEB Pará</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleResetChat}
            title="Reiniciar diálogo"
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contextual Status of Options 1, 2 & 3 */}
      <div className="bg-slate-100 border-b border-slate-200 px-3.5 py-2.5">
        {areOptions123Ready ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-[#005BAC] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#78BC61] animate-pulse" />
                Opções 1, 2 e 3 Carregadas
              </span>
              <span className="text-[9px] text-slate-500 font-semibold">{plan.turmaParticipante || 'Turma Definida'}</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-tight">
              <strong>{plan.unidadeCiseb}</strong> • {plan.temaImersao || plan.tituloSuporte}
            </p>
            <button
              onClick={handleOrientPhases123}
              disabled={isLoading}
              className="w-full mt-1 py-1.5 px-2 bg-[#005BAC] hover:bg-[#013780] text-white rounded-lg text-[11px] font-bold uppercase flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 fill-white" />
              Pedir alternativas para a Fase 1 (Empatia)
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-amber-900 bg-amber-50/90 border border-amber-200 rounded-lg p-2 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <span className="font-bold block text-amber-950">Preencha as Opções 1, 2 e 3 na Ficha</span>
              Ao preencher a Unidade, Tema e BNCC/ODS, a MAG fornecerá orientações personalizadas para as Fases 1, 2 e 3.
            </div>
          </div>
        )}
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold overflow-hidden shadow-xs border ${
                msg.role === 'user'
                  ? 'bg-[#005BAC] text-white border-sky-400/30'
                  : 'bg-sky-100 border-sky-300/60 ring-2 ring-amber-300/40'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-5 h-5" />
              ) : (
                <img src={magAvatar} alt="MAG" className="w-full h-full object-cover object-top scale-115" referrerPolicy="no-referrer" />
              )}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-1 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-[#005BAC] text-white rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}
            >
              {msg.isFallback && (
                <div className="mb-2.5 p-2 rounded-xl bg-amber-50 border border-amber-300/80 text-amber-900 text-[11px] leading-relaxed shadow-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Modo de Contingência Pedagógica Offline</span>
                  </div>
                  <p className="mt-1 text-[10px] text-amber-800">
                    A IA em tempo real não pôde ser consultada. Esta resposta foi gerada pela base de conhecimento pedagógico integrada do CISEB.
                  </p>
                  {msg.fallbackReason && (
                    <p className="mt-1 text-[9px] font-mono text-amber-700/90 bg-amber-100/70 p-1 rounded border border-amber-200/60 break-all">
                      Detalhe: {msg.fallbackReason}
                    </p>
                  )}
                </div>
              )}

              {msg.role === 'user' ? (
                <div className="whitespace-pre-line">{msg.content}</div>
              ) : (
                <div className="prose prose-xs text-xs text-slate-800 space-y-2 [&_p]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-1 [&_strong]:text-[#005BAC] [&_strong]:font-black">
                  <Markdown>{msg.content}</Markdown>
                </div>
              )}
              <span
                className={`block text-[9px] text-right ${
                  msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm border border-amber-300 ring-2 ring-amber-200/50 animate-pulse bg-sky-100">
              <img src={magAvatar} alt="MAG Pensando" className="w-full h-full object-cover object-top scale-120" referrerPolicy="no-referrer" />
            </div>
            
            <div className="bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tl-none p-3.5 text-xs shadow-sm flex items-center gap-2">
              <span className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-[#005BAC] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-[#005BAC] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-[#005BAC] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
              <span className="font-medium text-slate-500">A MAG está analisando os dados pedagógicos...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Suggestions Chips */}
      <div className="p-3 bg-white border-t border-slate-200 space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-500" /> Tópicos de Início:
        </span>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="text-[11px] text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-[#005BAC] border border-slate-200 rounded-lg px-2.5 py-1 transition-colors text-left cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Responda ou faça uma pergunta para a MAG..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005BAC] focus:bg-white transition-all"
          />

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 bg-[#005BAC] hover:bg-[#013780] text-white rounded-xl disabled:opacity-40 transition-colors shadow cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
