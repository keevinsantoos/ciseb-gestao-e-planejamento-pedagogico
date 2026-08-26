import React, { useState } from 'react';
import { AuthUser } from '../types';
import { changeUserPassword } from '../services/authService';
import { validatePasswordStrength } from '../data/cisebAccounts';
import { PasswordStrengthMeter } from './auth/PasswordStrengthMeter';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Building2,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  forcedMode?: boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  forcedMode = false,
}) => {
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const passwordValidation = validatePasswordStrength(newPassword);

  const handleClose = () => {
    if (forcedMode) return; // Prevent closing in forced mode until password is changed
    setCurrentPasswordInput('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPasswordInput) {
      setErrorMsg('Informe sua senha atual.');
      return;
    }

    if (!newPassword) {
      setErrorMsg('Informe sua nova senha.');
      return;
    }

    if (!passwordValidation.isValid) {
      setErrorMsg('A nova senha deve atender a todos os requisitos de segurança (mínimo 10 caracteres, maiúscula, minúscula, número e símbolo).');
      return;
    }

    if (newPassword === currentPasswordInput) {
      setErrorMsg('A nova senha deve ser diferente da senha atual.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('A confirmação não coincide com a nova senha digitada.');
      return;
    }

    setIsLoading(true);
    try {
      await changeUserPassword(currentPasswordInput, newPassword);
      setSuccessMsg('Senha alterada com sucesso! A nova senha já está ativa no Firebase Auth.');
      setCurrentPasswordInput('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao alterar a senha. Verifique sua senha atual.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#005BAC] to-[#013780] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <KeyRound className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white leading-tight">
                {forcedMode ? 'Troca Obrigatória de Senha' : 'Alterar Minha Senha'}
              </h2>
              <p className="text-xs text-sky-100/90 font-medium">
                {forcedMode
                  ? 'Defina uma senha pessoal segura para continuar'
                  : 'Atualize sua senha no Firebase Authentication'}
              </p>
            </div>
          </div>
          {!forcedMode && (
            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Forced Mode Notice */}
        {forcedMode && (
          <div className="bg-amber-50 dark:bg-amber-950/40 px-5 py-2.5 border-b border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold text-[11px]">
              Por segurança institucional, substitua a senha temporária por uma definitiva.
            </span>
          </div>
        )}

        {/* User Card Summary */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-5 py-3 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
            <User className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400" />
            <span className="truncate">{currentUser.nome}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 truncate">
              <Building2 className="w-3 h-3 text-[#005BAC] dark:text-sky-400" />
              {currentUser.unidadeCiseb}
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-slate-600 dark:text-slate-300 truncate">
              <Mail className="w-3 h-3 text-slate-400" />
              {currentUser.email}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. Senha Atual */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center justify-between">
              <span>Senha Atual (ou Temporária)</span>
              <span className="text-[10px] font-normal lowercase text-slate-400">para confirmação</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                placeholder="Digite sua senha atual"
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#005BAC] outline-hidden transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 2. Nova Senha */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Nova Senha Pessoal
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha forte"
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#005BAC] outline-hidden transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength Meter */}
            <PasswordStrengthMeter password={newPassword} />
          </div>

          {/* 3. Confirmar Nova Senha */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#005BAC] outline-hidden transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[10px] text-red-500 font-semibold mt-1">As senhas não conferem.</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center gap-2">
            {!forcedMode && (
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !passwordValidation.isValid}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#005BAC] hover:bg-[#004e96] text-white font-bold text-xs shadow-md shadow-[#005BAC]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Nova Senha</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
