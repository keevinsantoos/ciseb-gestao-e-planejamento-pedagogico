/**
 * LoginScreen CISEB — versão com ExpandableScreen e Carrossel de Unidades
 *
 * Estrutura:
 * - Fundo: carrossel automático com fotos das unidades CISEB
 * - Logo centralizada + subtítulo + badges + botão "Entrar no Sistema" como trigger expandível
 * - Ao clicar, o painel do formulário de login expande sobre a tela com animação suave
 *
 * Dependências:
 * - ./ui/ExpandableScreen (componente base de animação expandível)
 * - ./auth/LoginForm (formulário de login do projeto)
 * - ./auth/RegisterForm (formulário de cadastro do projeto)
 * - ../assets/images/mag_avatar_v2_1786994402829.jpg (avatar MAG)
 */
import React, { useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { CisebLogo } from './CisebLogo';
import { LoginForm } from './auth/LoginForm';
import {
  ExpandableScreen,
  ExpandableScreenContent,
  ExpandableScreenTrigger,
} from './ui/ExpandableScreen';
import {
  TextureCard,
  TextureCardHeader,
  TextureCardTitle,
  TextureCardDescription,
  TextureCardContent,
  TextureSeparator,
} from '@/components/ui/texture-card';
import {
  KeyRound,
  Headphones,
  ExternalLink,
  LogIn,
  Mail,
  ChevronLeft,
  ChevronRight,
  School,
  Sparkles,
  Cpu,
  BookOpen,
  Leaf,
} from 'lucide-react';
import { DEFAULT_SUPPORT_URL } from './Header';
import { DEFAULT_UNIT_SLIDES, UnitSlide } from '../data/unitSlides';
import CisebVisualCarousel from './CisebVisualCarousel';

// ─── PROPS ───────────────────────────────────────────────────────────────────
interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  slides?: UnitSlide[];
}

const SLIDE_INTERVAL = 6000; // Troca a cada 6 segundos

// ─── COMPONENTE ───────────────────────────────────────────────────────────────
export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  theme = 'light',
  onToggleTheme,
  slides = DEFAULT_UNIT_SLIDES,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Rotação automática do carrossel
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const activeSlide = slides[currentSlideIndex] || slides[0];

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-slate-950"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── FUNDO: CARROSSEL DE FOTOS DAS UNIDADES CISEB ──────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {slides.map((slide, index) => {
          const isActive = index === currentSlideIndex;
          return (
            <div
              key={slide.id || index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              } transform transition-transform duration-7000`}
            >
              <img
                src={slide.src}
                alt={slide.unitName}
                className="w-full h-full object-cover object-center"
              />
            </div>
          );
        })}

        {/* Gradiente escurecendo a foto para alto contraste e legibilidade institucional */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#010f24] via-[#003875]/65 to-[#011a40]/80 backdrop-brightness-75" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#010f24]/50 to-[#010f24]/90" />

        {/* Glows de ambientação e textura */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#005BAC]/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#013780]/40 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjYSkiIG9wYWNpdHk9IjAuMDQiLz48L3N2Zz4=')] opacity-30" />
      </div>

      {/* ── CONTROLES E IDENTIFICAÇÃO DA UNIDADE ATUAL (CARROSSEL) ────────── */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 z-10 flex flex-col items-center gap-2 pointer-events-auto">
          {/* Indicadores e setas de navegação */}
          <div className="flex items-center gap-3 mt-0.5">
            <button
              type="button"
              onClick={handlePrevSlide}
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentSlideIndex(i)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    i === currentSlideIndex
                      ? 'w-6 h-2 bg-white'
                      : 'w-2 h-2 bg-white/40 hover:bg-white/75'
                  }`}
                  aria-label={`Ir para foto da unidade ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNextSlide}
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Próxima foto"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── CONTEÚDO PRINCIPAL (ExpandableScreen) ─────────────────────────── */}
      <div className="relative z-30 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <ExpandableScreen
          layoutId="ciseb-login"
          triggerRadius="50px"
          contentRadius="0px"
        >
          {/* ── HERO: LOGO + BOTÃO ─────────────────────────────── */}
          <div className="flex flex-col items-center gap-8 text-center">
            {/* Logo com destaque ampliado */}
            <div className="drop-shadow-2xl">
              <CisebLogo className="h-36 sm:h-48 md:h-60 lg:h-72 w-auto max-w-[92vw]" variant="light" />
            </div>

            {/* Botão principal — TRIGGER DO EXPANDABLE */}
            <ExpandableScreenTrigger>
              <div
                className="flex items-center gap-3 bg-gradient-to-r from-[#005BAC] to-[#013780] hover:from-[#004e96] hover:to-[#012d6a] text-white px-8 sm:px-10 py-4 text-base sm:text-lg font-bold shadow-2xl shadow-[#005BAC]/40 ring-4 ring-white/10 hover:ring-white/20 transition-all duration-300 hover:scale-[1.02] active:scale-98 cursor-pointer"
                role="button"
                aria-label="Abrir painel de autenticação do CISEB"
              >
                <LogIn className="w-5 h-5 text-sky-200" />
                <span className="tracking-wide">Entrar no Sistema</span>
              </div>
            </ExpandableScreenTrigger>

            {/* Link de suporte */}
            <a
              href={DEFAULT_SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white text-xs font-medium transition-all backdrop-blur-xs shadow-sm hover:shadow"
              aria-label="Abrir Central de Suporte CISEB em nova aba"
            >
              <Headphones className="w-3.5 h-3.5 text-sky-400" />
              <span>Central de Suporte CISEB</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>

          {/* ── PAINEL EXPANDIDO: TELA INTEGRAL COM EXPOSITOR 3D DOS 6 TEMAS CISEB ─── */}
          <ExpandableScreenContent className="p-0 border-0 rounded-none bg-white dark:bg-slate-900">
            <div className="min-h-[100dvh] lg:h-[100dvh] w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col justify-between lg:overflow-hidden">
              <div className="grid min-h-[100dvh] lg:h-[100dvh] w-full grid-cols-1 lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)] min-w-0 items-stretch">
                {/* ── ÁREA 1: AUTENTICAÇÃO (COLUNA ESQUERDA - APROX 42%) ────────────────── */}
                <section className="w-full min-w-0 flex flex-col justify-between p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-slate-800 overflow-y-auto min-h-[100dvh] lg:h-[100dvh]">
                  <div className="w-full max-w-[560px] mx-auto flex flex-col justify-between min-h-full py-2 gap-4 sm:gap-6">
                    <div>
                      {/* Topo / Logo CISEB Adaptável */}
                      <div className="flex items-center justify-start mb-4 sm:mb-6">
                        <CisebLogo
                          className="w-auto h-14 sm:h-16 md:h-20 lg:h-24 max-w-[min(300px,85%)] object-contain transition-transform shrink-0"
                          variant={theme === 'dark' ? 'light' : 'dark'}
                        />
                      </div>

                      {/* Cabeçalho Responsivo */}
                      <div className="space-y-1 sm:space-y-1.5 mb-5 text-left min-w-0">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white break-words">
                          Acesso Oficial CISEB 1.0
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed break-words">
                          Login exclusivo com sua conta Google institucional SEDUC/PA
                        </p>
                      </div>

                      {/* Formulário Funcional Google Oficial */}
                      <div className="w-full min-w-0">
                        <LoginForm
                          onLoginSuccess={onLogin}
                        />
                      </div>
                    </div>

                    {/* Rodapé Interno da Autenticação */}
                    <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 dark:text-slate-500 min-w-0">
                      <span>CISEB · SEDUC Pará</span>
                      <span className="font-medium text-[#005BAC] dark:text-sky-400 whitespace-nowrap">16 Unidades Integradas</span>
                    </div>
                  </div>
                </section>

                {/* ── ÁREA 2: EXPOSITOR 3D INTERATIVO DOS 6 TEMAS CISEB (COLUNA DIREITA - APROX 58%) ── */}
                <section className="w-full min-w-0 flex flex-col h-full min-h-[500px] lg:h-[100dvh] lg:min-h-full bg-gradient-to-br from-[#012d6a] via-[#005BAC] to-[#013780] overflow-hidden self-stretch relative">
                  <CisebVisualCarousel />
                </section>
              </div>
            </div>
          </ExpandableScreenContent>

        </ExpandableScreen>
      </div>
    </div>
  );
};

export default LoginScreen;
