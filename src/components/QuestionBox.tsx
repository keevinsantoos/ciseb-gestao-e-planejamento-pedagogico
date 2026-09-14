import React, { useState, useId } from 'react';
import {
  HelpCircle,
  X,
  CheckCircle2,
  Loader2,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { MorphSurface, MorphSurfaceTrigger, MorphSurfaceContent } from './ui/morph-surface';
import { saveQuestionToFirestore } from '../services/firestoreService';
import { AuthUser } from '../types';

interface QuestionBoxProps {
  currentUser?: AuthUser | null;
  className?: string;
  variant?: 'floating' | 'embedded';
}

const formFieldClassName =
  'w-full rounded-lg border-0 bg-[#18181b] px-4 py-2.5 text-white shadow-none placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all text-sm';

export const QuestionBox: React.FC<QuestionBoxProps> = ({
  currentUser,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const nameId = useId();
  const emailId = useId();
  const useCaseId = useId();
  const teamSizeId = useId();
  const messageId = useId();

  const [fullName, setFullName] = useState(currentUser?.nome || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [useCase, setUseCase] = useState('');
  const [teamSize, setTeamSize] = useState('Select');
  const [pergunta, setPergunta] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when currentUser updates
  React.useEffect(() => {
    if (currentUser) {
      if (!fullName) setFullName(currentUser.nome || '');
      if (!email) setEmail(currentUser.email || '');
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Por favor, informe seu nome.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const details = [
        useCase.trim() ? `[Use Case: ${useCase.trim()}]` : '',
        teamSize !== 'Select' ? `[Team Size: ${teamSize}]` : '',
        pergunta.trim() ? pergunta.trim() : 'Waitlist reservation'
      ].filter(Boolean).join(' - ');

      await saveQuestionToFirestore(details, {
        nome: fullName.trim() || currentUser?.nome || 'Alex Rivera',
        email: email.trim() || currentUser?.email || 'alex@example.com',
      });
      setIsSubmitted(true);
      setPergunta('');
      setUseCase('');
    } catch (err: any) {
      console.error('Erro ao enviar dados:', err);
      setErrorMessage('Ocorreu um erro ao enviar sua solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setPergunta('');
    setUseCase('');
    setTeamSize('Select');
    setErrorMessage(null);
  };

  return (
    <MorphSurface
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      className={className}
      layoutId="ciseb-question-morph-box"
    >
      {/* TRIGGER */}
      <MorphSurfaceTrigger
        className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl hover:border-[#005BAC]/40 dark:hover:border-sky-500/40 transition-all cursor-pointer"
      >
        <div className="w-7 h-7 rounded-full bg-[#005BAC]/10 dark:bg-sky-500/20 text-[#005BAC] dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div className="text-left pr-1">
          <p className="text-xs font-bold leading-tight">Reserve your spot</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Early Access & Suporte</p>
        </div>
      </MorphSurfaceTrigger>

      {/* EXPANDED SCREEN CONTENT MATCHING EXACT REFERENCE */}
      <MorphSurfaceContent
        showOverlay={true}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[94vw] max-w-[1100px] max-h-[92vh] overflow-y-auto bg-[#e5e5e5] dark:bg-[#121214] text-slate-900 dark:text-zinc-100 border border-slate-300/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 lg:p-14 shadow-2xl z-50 font-sans"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setTimeout(handleReset, 300);
          }}
          className="absolute top-5 right-5 sm:top-6 sm:right-6 p-2 rounded-full text-slate-800 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer z-20"
          aria-label="Close"
        >
          <X className="w-5 h-5 stroke-[2]" />
        </button>

        {!isSubmitted ? (
          <div className="relative z-10 flex flex-col lg:flex-row h-full w-full mx-auto items-start p-2 sm:p-4 lg:p-6 gap-8 lg:gap-16">
            {/* LEFT COLUMN */}
            <div className="flex-1 flex flex-col justify-center space-y-4 w-full">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-slate-900 dark:text-white leading-none tracking-[-0.03em]">
                Reserve your spot
              </h2>

              <div className="space-y-4 sm:space-y-6 pt-4">
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-300/80 dark:bg-zinc-800 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900 dark:text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <title>Icon</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm sm:text-base text-slate-800 dark:text-zinc-300 leading-[150%]">
                      Get priority access to new features and updates before public release.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-300/80 dark:bg-zinc-800 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900 dark:text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <title>Icon</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm sm:text-base text-slate-800 dark:text-zinc-300 leading-[150%]">
                      Join a community of early adopters and help influence our product roadmap.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-slate-300 dark:border-zinc-800">
                <p className="text-lg sm:text-xl lg:text-2xl text-slate-800 dark:text-zinc-200 leading-[150%] mb-4">
                  The waitlist has been a game-changer for our workflow. Highly recommend joining early.
                </p>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-300 dark:bg-zinc-800 flex items-center justify-center text-slate-800 dark:text-zinc-200 font-bold text-sm shrink-0 shadow-inner">
                    AR
                  </div>
                  <div>
                    <p className="text-base sm:text-lg lg:text-xl font-medium text-slate-900 dark:text-white">
                      Alex Rivera
                    </p>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400">
                      Early Access Member
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: FORM */}
            <div className="flex-1 w-full">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label
                    htmlFor={nameId}
                    className="block text-[10px] font-mono font-normal text-slate-700 dark:text-zinc-400 mb-2 tracking-[0.5px] uppercase"
                  >
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    id={nameId}
                    name="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className={formFieldClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor={emailId}
                    className="block text-[10px] font-mono font-normal text-slate-700 dark:text-zinc-400 mb-2 tracking-[0.5px] uppercase"
                  >
                    EMAIL *
                  </label>
                  <input
                    type="email"
                    id={emailId}
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={formFieldClassName}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label
                      htmlFor={useCaseId}
                      className="block text-[10px] font-mono font-normal text-slate-700 dark:text-zinc-400 mb-2 tracking-[0.5px] uppercase"
                    >
                      USE CASE
                    </label>
                    <input
                      type="text"
                      id={useCaseId}
                      name="use-case"
                      value={useCase}
                      onChange={(e) => setUseCase(e.target.value)}
                      placeholder="e.g., Project management, Team collaboration"
                      className={formFieldClassName}
                    />
                  </div>

                  <div className="sm:w-36 w-full">
                    <label
                      htmlFor={teamSizeId}
                      className="block text-[10px] font-mono font-normal text-slate-700 dark:text-zinc-400 mb-2 tracking-[0.5px] uppercase"
                    >
                      TEAM SIZE
                    </label>
                    <div className="relative">
                      <select
                        id={teamSizeId}
                        name="team-size"
                        value={teamSize}
                        onChange={(e) => setTeamSize(e.target.value)}
                        className={`${formFieldClassName} appearance-none pr-8 cursor-pointer`}
                      >
                        <option value="Select">Select</option>
                        <option value="solo">Solo</option>
                        <option value="2-5">2-5</option>
                        <option value="6-20">6-20</option>
                        <option value="21-50">21-50</option>
                        <option value="50+">50+</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={messageId}
                    className="block text-[10px] font-mono font-normal text-slate-700 dark:text-zinc-400 mb-2 tracking-[0.5px] uppercase"
                  >
                    WHAT ARE YOU MOST EXCITED ABOUT?
                  </label>
                  <textarea
                    id={messageId}
                    name="excited-about"
                    rows={3}
                    value={pergunta}
                    onChange={(e) => setPergunta(e.target.value)}
                    placeholder="Tell us what features you're looking forward to..."
                    className={`${formFieldClassName} resize-none py-3`}
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-8 py-3 rounded-full bg-[#18181b] hover:bg-black text-white font-medium hover:opacity-95 transition-all tracking-[-0.03em] h-11 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Join waitlist</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* SUCCESS STATE */
          <div className="py-12 px-4 text-center max-w-md mx-auto space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 text-emerald-400 flex items-center justify-center mx-auto shadow-lg border border-zinc-800">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                You&apos;re on the waitlist!
              </h3>
              <p className="text-sm text-slate-700 dark:text-zinc-300 mt-2 leading-relaxed">
                Thank you for reserving your spot. We&apos;ll be in touch with updates and priority access soon.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 px-4 rounded-full bg-slate-300/80 dark:bg-zinc-800 hover:bg-slate-400/80 dark:hover:bg-zinc-700 text-slate-900 dark:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Submit another response
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setTimeout(handleReset, 300);
                }}
                className="w-full py-3 px-4 rounded-full bg-[#18181b] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </MorphSurfaceContent>
    </MorphSurface>
  );
};


