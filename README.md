# Documentação Técnica — CISEB · Gestão e Planejamento Pedagógico

Documento de referência para quem for manter, dar suporte ou evoluir o código.
Não é necessário para usar o sistema — veja os manuais de usuário para isso.

---

## 1. Visão geral e stack

Aplicação web full-stack em TypeScript:

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 (`@tailwindcss/vite`) |
| Backend (dev/local) | Node + Express, executado com `tsx server.ts` |
| Backend (produção na Vercel) | `api/index.ts`, empacotado como função serverless |
| Autenticação | Firebase Authentication (login Google restrito ao domínio SEDUC) |
| Banco de dados | Firestore (coleções `plans`, `accounts`, `escolas`, `perguntas`) |
| Administração de contas | Firebase Admin SDK (via `FIREBASE_SERVICE_ACCOUNT_KEY`) |
| Inteligência artificial | Google Gemini (`@google/genai`, modelo `gemini-2.5-flash-lite`) |
| Projetos acadêmicos | Google Sheets, como banco de dados relacional simples (20 abas) |
| Hospedagem | Vercel (`vercel.json` reescreve `/api/*` para `api/index.ts`) |

### Scripts (`package.json`)

```
npm run dev      # tsx server.ts — servidor Express com Vite em modo middleware
npm run build    # vite build (frontend) + esbuild do server.ts -> dist/server.cjs
npm run start    # node dist/server.cjs — roda o build de produção localmente
npm run preview  # vite preview
npm run lint     # tsc --noEmit — checagem de tipos, sem gerar arquivos
npm run clean    # remove dist/ e server.cjs
```

### Variáveis de ambiente (`.env`)

| Variável | Obrigatória | Uso |
|---|---|---|
| `GEMINI_API_KEY` (ou `GEMINI-KEY` / `GEMINI_KEY` / `API_KEY`) | Sim, para a IA funcionar | Chave da API Gemini. `/api/health` informa se alguma dessas está presente. |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Recomendada | JSON da conta de serviço do Firebase Admin, usado para criar/editar/excluir contas no servidor. |
| `VITE_MAG_EXTERNAL_URL` | Opcional | URL da MAG externa (fora do sistema). Se ausente, usa o valor padrão definido em `src/types.ts` (`DEFAULT_MAG_EXTERNAL_URL`). |
| `APP_URL` | Opcional | URL pública onde o app está publicado (self-reference). |

---

## 2. Estrutura de pastas

```
src/
  main.tsx              # ponto de entrada do React
  App.tsx               # componente raiz: roteamento por estado (activeView) e guarda de sessão
  types.ts               # tipos centrais: CisebSessionPlan, AuthUser, CisebEscola, CisebRegisteredAccount...
  types/
    academicProjects.ts  # tipos do módulo de Projetos Acadêmicos
    chamados.ts           # tipos dos chamados de suporte (planilha)
  hooks/
    useAuth.ts            # hook de autenticação (observa Firebase Auth + Firestore)
  lib/
    firebase.ts           # inicialização do Firebase (client)
    apiUtils.ts            # helper para chamadas fetch seguras (safeJsonFetch)
    utils.ts               # utilitários genéricos (ex.: cn() para classes Tailwind)
  services/
    authService.ts         # login/logout, criação/edição/exclusão de conta (client -> API admin)
    adminService.ts        # CRUD de professores e unidades (Firestore direto)
    escolasService.ts      # leitura/cadastro de unidades CISEB (Firestore)
    firestoreService.ts    # CRUD de planos de trabalho + expurgo automático de 7 dias
    spreadsheetService.ts  # utilitários de leitura de planilhas do Google (chamados)
    academicApiService.ts  # chamadas fetch para as rotas /api/... de projetos acadêmicos
  data/
    cisebAccounts.ts       # contas semente / funções de apoio a contas
    unitSlides.ts           # fotos do carrossel da tela de entrada (persistidas em localStorage)
    defaultChamados.ts      # CSV de exemplo + parser de CSV (RFC 4180) para chamados
    dres.ts                  # lista de Diretorias Regionais de Educação
  components/
    LoginScreen.tsx, auth/LoginForm.tsx      # tela e formulário de login
    Header.tsx                                 # barra azul superior (ações contextuais por view)
    hub/Hub.tsx, hub/ToolCard.tsx, hub/DevelopmentModal.tsx  # tela inicial e cartões das ferramentas
    SessionForm.tsx, FormStepper.tsx           # formulário do Plano de Trabalho (5 etapas)
    ReportView.tsx                              # plano em formato de relatório/impressão
    HistoryDrawer.tsx                           # gaveta "Meus Planos Salvos"
    AiCopilotDrawer.tsx                         # painel de conversa com a MAG
    CurriculumGuideModal.tsx                    # guia "Referencial Pará"
    UnitSelectorModal.tsx                       # seleção/troca de unidade CISEB
    ManageSlidesModal.tsx                       # gestão das fotos do carrossel
    ChangePasswordModal.tsx                     # troca de senha forçada (fluxo legado)
    MonitoringDashboard.tsx                      # Painel de Monitoramento (4 abas)
    monitoring/ChamadosDashboard.tsx             # aba "Tempo Real" (chamados de suporte)
    monitoring/ComparativoCrossView.tsx          # aba "Cruzamento" (pedagógico x suporte)
    admin/AdminManagementPanel.tsx               # Administração (professores/unidades/auditoria)
    AccountManagerModal.tsx                       # gestão de contas (modal alternativo/legado)
    academic/                                      # módulo de Projetos Acadêmicos (ver seção 5)
    ui/                                             # componentes utilitários de interface (popover, tabs, etc.)
server/
  config/sheetsSchema.ts          # definição das ~20 abas da Planilha Oficial de Projetos
  services/GoogleSheetsService.ts # leitura/escrita na planilha do Google (projetos acadêmicos)
  services/ProjectService.ts       # regras de negócio dos projetos (isolamento por usuário, status, etc.)
  services/DashboardService.ts     # agregações para o painel de projetos acadêmicos
  routes/academicProjectRoutes.ts  # rotas Express de /api/... para projetos acadêmicos
server.ts                          # servidor Express (uso local/dev e build de produção fora da Vercel)
api/index.ts                       # variante do servidor para rodar como função serverless na Vercel
firestore.rules                    # regras de segurança do Firestore
vercel.json                        # configuração de deploy/rewrite na Vercel
```

---

## 3. Fluxo de autenticação

1. `LoginScreen` → `auth/LoginForm` dispara `signInGoogleCredential()` (popup do Google).
2. `authService.loginWithGoogle()` valida se o e-mail termina em `@escola.seduc.pa.gov.br` ou `@seduc.pa.gov.br`; caso contrário, recusa com mensagem amigável (`getFriendlyAuthErrorMessage`).
3. `fetchOrCreateGoogleUserProfile()` busca o documento do usuário na coleção `accounts` do Firestore pelo e-mail. **O acesso só é liberado se o e-mail já tiver sido pré-cadastrado** por um administrador (via Administração → aba Professores). Não existe autocadastro.
4. Se a conta existir e estiver ativa, monta um `AuthUser` (contém `role`: `'formador' | 'coordenador' | 'monitoramento'`, `unidadeCiseb`, etc.) e grava em `localStorage` (`AUTH_STORAGE_KEY`).
5. `useAuth()` expõe esse usuário para toda a árvore de componentes; `App.tsx` usa `currentUser.role` para decidir quais views/cartões mostrar.
6. Criação, edição, exclusão e reset de senha de contas passam pelas rotas `/api/admin/accounts...` no servidor (`server.ts` / `api/index.ts`), protegidas por `requireAdminAuth`, que usa o Firebase Admin SDK — nunca é feito diretamente do navegador com privilégios de admin.

### Perfis e visibilidade (`src/components/hub/Hub.tsx`)

| Cartão | formador | coordenador | monitoramento |
|---|---|---|---|
| Plano de Trabalho | Sim | Sim | Sim |
| Cadastro de Projetos | Sim | Sim | Sim |
| Avaliação Pedagógica (placeholder) | Sim | Sim | Sim |
| Painel de Monitoramento | Não | Sim | Sim |
| Administração | Não | Não | Sim |

`App.tsx` mantém um único estado `activeView` (`'hub' | 'edit' | 'report' | 'monitoring' | 'admin' | 'projects'`) que funciona como um roteador simples baseado em estado — não há `react-router`.

---

## 4. Plano de Trabalho (`SessionForm` + `firestoreService`)

- **Modelo de dados:** `CisebSessionPlan` (`src/types.ts`), com campos de identificação, planejamento, BNCC/ODS, Design Thinking (3 fases) e execução, além de metadados de autoria (`createdBy`, `authorEmail`, `authorNome`) e datas.
- **Persistência:** `firestoreService.ts` salva cada plano na coleção `plans` do Firestore e mantém uma cópia espelhada em `localStorage` (`ciseb_saved_plans_v2`) para leitura rápida/offline.
- **Expiração automática:** `isPlanExpired()` (em `types.ts`) e `purgeExpiredPlans()` (em `firestoreService.ts`) removem, a cada carregamento da lista, qualquer plano com mais de `PLAN_RETENTION_DAYS` (7) dias sem atualização — tanto do Firestore quanto do `localStorage`.
- **Relatório/impressão:** `ReportView.tsx` apenas formata o plano existente e chama `window.print()`; não há geração de PDF no servidor — o PDF é gerado pelo próprio navegador ("Salvar como PDF" na janela de impressão).
- **Assistência de IA:** botões no formulário chamam a rota `/api/gemini/generate-plan` (modelo `gemini-2.5-flash-lite`, `temperature: 0.7`) para sugerir/completar campos específicos ou o plano inteiro.

---

## 5. MAG (Copiloto de IA)

- Componente: `AiCopilotDrawer.tsx`.
- Chama `POST /api/gemini/chat`, que devolve `{ success, reply, isFallback?, fallbackReason? }`.
- Quando a IA principal falha (ex.: limite de cota), o servidor pode responder em modo de contingência (`isFallback: true`), e a interface exibe o aviso com o motivo.
- Mensagem inicial fixa (`INITIAL_MAG_PRESENTATION`) define a persona "MAG (Magda Soares)".
- Existe também um botão fixo "Conheça a MAG" que **não** usa a IA interna: abre, em nova aba, a URL externa `VITE_MAG_EXTERNAL_URL`.

---

## 6. Cadastro de Projetos Acadêmicos

Módulo mais extenso do sistema, com **frontend em `src/components/academic/`** e **backend dedicado em `server/`**.

### 6.1 Frontend

| Componente | Papel |
|---|---|
| `AcademicProjectsManager.tsx` | Contêiner com as abas "Meus Projetos" / "Todos os Projetos" / "Cadastrar Projeto". |
| `AcademicProjectWizard.tsx` | Formulário em 7 etapas (Informações Gerais → Equipe → Resumo → Problematização → Metodologia → BNCC/ODS → Ética). Permite salvar rascunho (`handleSaveDraft`) ou submeter. |
| `AcademicProjectList.tsx` | Listagem com busca e filtro por área do conhecimento. |
| `AcademicProjectDetailModal.tsx` | Detalhe de um projeto, incluindo histórico de alterações. |
| `AcademicDashboardView.tsx` | Painel com KPIs e gráficos (usado dentro do Painel de Monitoramento, aba "Projetos"). |
| `AcademicSpreadsheetModal.tsx` | Baixa o `.xlsx` gerado no servidor ou conecta uma planilha do Google Drive por link/ID. |

Tipos em `src/types/academicProjects.ts` (Institution, KnowledgeArea, ResearchLine, BNCCItem, ODSItem, `ProjectStatus`, etc.). Todas as chamadas de rede passam por `services/academicApiService.ts`.

### 6.2 Backend

- `server/config/sheetsSchema.ts` define o esquema das ~20 abas da planilha oficial (`PROJETOS`, `UNIDADES_CISEB`, `AUTORES`, `PROJETO_AUTORES`, `ORIENTADORES`, `PROJETO_ORIENTADORES`, `METODOLOGIA`, `OBJETIVOS`, `PALAVRAS_CHAVE`, `PROJETO_BNCC`, `PROJETO_ODS`, `REFERENCIAS`, `AVALIACOES`, `HISTORICO`, `USUARIOS`, `INSTITUICOES`, `AREAS_CONHECIMENTO`, `LINHAS_PESQUISA`, `BNCC`, `ODS`, `CONFIG`) e dados iniciais (`INITIAL_*`).
- `server/services/GoogleSheetsService.ts` é a camada de acesso à planilha (leitura/escrita nas abas acima).
- `server/services/ProjectService.ts` concentra as regras de negócio, entre elas:
  - **Isolamento por usuário no backend:** `listProjects()` retorna apenas os projetos do próprio solicitante quando `role !== 'monitoramento'`; a equipe de monitoramento vê tudo e pode filtrar livremente.
  - Normalização de status para apenas 4 valores oficiais (`EM_ANDAMENTO`, `CONCLUIDO`, `PAUSADO`, `NAO_INICIADO`) — não há fluxo de aprovação, nota ou banca.
  - Criação/atualização de projeto grava nas várias abas relacionadas (autores, orientadores, metodologia, objetivos, palavras-chave, BNCC, ODS, referências) e registra em `HISTORICO`.
- `server/services/DashboardService.ts` calcula os agregados usados em `AcademicDashboardView.tsx`.
- `server/routes/academicProjectRoutes.ts` expõe as rotas REST (prefixo montado em `/api` pelo servidor):

```
GET  /meus-projetos              # projetos do usuário autenticado
GET  /projetos                   # lista (com isolamento por role) + filtros
GET  /projetos/:id                # detalhe
POST /projetos                    # criação
PUT  /projetos/:id                # atualização
PATCH /projetos/:id/status        # troca de status (só os 4 oficiais)
GET  /projetos/:id/historico      # histórico de alterações
GET  /dashboard                   # KPIs e agregados
GET  /unidades | /areas | /linhas-pesquisa | /bncc | /ods | /instituicoes  # listas de apoio (combos)
GET  /test/security-isolation     # rota de diagnóstico do isolamento por usuário
GET  /sheets/status               # status da conexão com a planilha
GET  /sheets/download-xlsx        # baixa a planilha oficial em .xlsx
GET  /sheets/summary              # resumo/estatísticas da planilha
POST /sheets/config               # configura uma planilha do Google (link/ID)
POST /sheets/initialize            # inicializa as abas com o schema padrão
```

---

## 7. Painel de Monitoramento

Componente `MonitoringDashboard.tsx`, com quatro abas controladas por estado (`dashboardTab`):

| Aba | Fonte de dados | Componente |
|---|---|---|
| Pedagógico | Planos de trabalho (Firestore) | Cartões e gráficos calculados no próprio `MonitoringDashboard.tsx` (`useMemo`) a partir de `filteredPlans` |
| Tempo Real | Chamados de suporte, lidos de uma planilha do Google (link ou CSV colado) | `monitoring/ChamadosDashboard.tsx` |
| Cruzamento | Cruza planos x chamados por unidade | `monitoring/ComparativoCrossView.tsx` |
| Projetos | Projetos acadêmicos | `academic/AcademicDashboardView.tsx` |

Os chamados usam os tipos de `src/types/chamados.ts` (`ChamadoRecord`, `SpreadsheetSource`) e o parser RFC 4180 em `src/data/defaultChamados.ts` (`parseCSV`) para interpretar tanto CSV colado manualmente quanto o retorno de uma planilha do Google.

---

## 8. Administração

Componente `admin/AdminManagementPanel.tsx`, com três abas: **Professores**, **Unidades** e **Auditoria**. Toda a lógica de CRUD passa por `src/services/adminService.ts`, que lê/escreve diretamente no Firestore (coleções `accounts` e `escolas`) e inclui utilitários específicos como `detectSimilarUnit()` (evita unidades duplicadas por nome parecido) e `verificarExclusaoUnidade()` (impede excluir uma unidade que já tem histórico). Ações administrativas mais sensíveis (criar/editar/excluir **contas**, especificamente) passam pelo backend (`server.ts` / `api/index.ts`, rotas `/api/admin/accounts...`) por exigirem o Firebase Admin SDK.

---

## 9. Regras de segurança (Firestore) — `firestore.rules`

| Coleção | Leitura | Escrita |
|---|---|---|
| `escolas` | Pública | Criar/editar exige dado válido; excluir exige perfil de monitoramento |
| `accounts` | Pública | Criar/editar exige dado válido; excluir exige ser `admin_coordenacao` ou monitoramento |
| `plans` | Pública | Criar/editar exige usuário autenticado e plano válido; excluir exige autenticação |
| `perguntas` | Pública | Criar/editar exige autenticação; excluir exige autenticação ou monitoramento |
| qualquer outro caminho | Bloqueado | Bloqueado |

> A leitura é pública porque parte da interface (ex.: cartões de unidades na tela de login) precisa funcionar antes do login. A escrita é sempre condicionada a validação de dados e, nas ações mais sensíveis, ao perfil do usuário.

---

## 10. Servidor: `server.ts` vs `api/index.ts`

O projeto mantém **dois pontos de entrada de servidor equivalentes**, porque a Vercel exige uma função serverless separada:

- **`server.ts`** — usado em desenvolvimento local (`npm run dev`, com Vite em modo middleware) e no build tradicional (`npm run build && npm run start`). Serve os arquivos estáticos de `dist/` em produção fora da Vercel.
- **`api/index.ts`** — versão enxuta do mesmo servidor, sem servir arquivos estáticos (a Vercel já cuida disso separadamente), usada como função serverless. `vercel.json` reescreve todo `/api/*` para este arquivo.

Rotas presentes nos dois: `/api/health`, `/api/gemini/generate-plan`, `/api/gemini/chat`. As rotas de administração de contas (`/api/admin/accounts...`) e o middleware de projetos acadêmicos (`academicProjectRouter`) estão em `server.ts`; ao alterar uma rota compartilhada, replique a mudança no outro arquivo para não gerar divergência entre ambiente local e produção.

`GET /api/health` retorna `{ status, timestamp, hasGeminiKey, hasFirebaseAdmin }` — útil para diagnosticar rapidamente se as variáveis de ambiente estão configuradas.

---

## 11. Convenções e pontos de atenção

- **Sem roteador de URL:** a navegação é feita trocando o estado `activeView` em `App.tsx`. Não existem URLs próprias por tela.
- **Estilização:** Tailwind CSS v4 via plugin do Vite (`@tailwindcss/vite`), sem `tailwind.config` tradicional nem PostCSS/Autoprefixer — as classes são o único mecanismo de estilo.
- **Dados sensíveis:** a chave Gemini e a credencial do Firebase Admin só existem no servidor; o cliente nunca as recebe diretamente.
- **`localStorage` usado com propósito específico:** sessão do usuário (`ciseb_auth_user_v1`), cópia local dos planos (`ciseb_saved_plans_v2`), preferência de tema e fotos do carrossel da tela de login (`ciseb_unit_slides_v3`) — este último **não é sincronizado entre computadores**.
- **Planilhas do Google como "banco de dados":** tanto os projetos acadêmicos quanto os chamados de suporte usam planilhas do Google como fonte de dados, em vez de uma tabela relacional tradicional. Qualquer mudança de estrutura de colunas deve ser refletida em `sheetsSchema.ts` (projetos) ou no parser de `defaultChamados.ts` (chamados).
- **Manutenção anterior:** uma limpeza de código morto já foi realizada (componentes órfãos, imagens duplicadas, dependências não usadas). Ao adicionar um componente novo, verifique se ele é realmente importado a partir de `src/main.tsx` antes de considerá-lo "em uso".

---

## 12. Onde começar, por tarefa

| Você quer... | Comece por |
|---|---|
| Mudar um campo do Plano de Trabalho | `src/types.ts` (campo) → `src/components/SessionForm.tsx` (formulário) → `src/components/ReportView.tsx` (relatório) |
| Mudar o texto ou o comportamento da MAG | `src/components/AiCopilotDrawer.tsx` (frontend) e a rota `/api/gemini/chat` em `server.ts`/`api/index.ts` |
| Adicionar um campo ao Cadastro de Projetos | `src/types/academicProjects.ts` → `AcademicProjectWizard.tsx` → `server/config/sheetsSchema.ts` → `server/services/ProjectService.ts` |
| Mudar quem vê qual cartão | `src/components/hub/Hub.tsx` (condição de exibição) e `src/App.tsx` (roteamento de `activeView`) |
| Mudar regras de acesso a dados | `firestore.rules` |
| Adicionar uma unidade CISEB | Via tela (Administração → Unidades) ou, em massa, `src/services/escolasService.ts` |
