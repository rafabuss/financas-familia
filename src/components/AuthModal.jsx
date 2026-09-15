import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Shield,
  X,
  AlertCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { signInWithPassword, signUpUser, isSupabaseConfigured } from '../services/supabase';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, isMandatory = false }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedMember, setSelectedMember] = useState('user-1'); // 'user-1' (Rafael) | 'user-2' (Ana Débora)
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const isCloud = isSupabaseConfigured();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        const role = selectedMember === 'user-1' ? 'admin' : 'member';
        const defaultName = name || (selectedMember === 'user-1' ? 'Rafael' : 'Ana Débora');
        const { data, error } = await signUpUser(email, password, defaultName, role, selectedMember);

        if (error) {
          setErrorMsg(error.message || 'Erro ao realizar cadastro.');
        } else {
          setSuccessMsg('Cadastro realizado com sucesso!');
          if (data?.user) {
            onLoginSuccess({
              id: data.user.id,
              email: data.user.email,
              name: defaultName,
              role,
              memberKey: selectedMember,
            });
            if (onClose) onClose();
          }
        }
      } else {
        const { data, error } = await signInWithPassword(email, password);

        if (error) {
          setErrorMsg(error.message || 'E-mail ou senha incorretos.');
        } else if (data?.user) {
          const profile = data.profile || {};
          const role = profile.role || data.user.user_metadata?.role || (email.includes('anadebora') ? 'member' : 'admin');
          const memberKey = profile.member_key || data.user.user_metadata?.memberKey || (role === 'admin' ? 'user-1' : 'user-2');
          const userName = profile.name || data.user.user_metadata?.name || (memberKey === 'user-1' ? 'Rafael' : 'Ana Débora');

          onLoginSuccess({
            id: data.user.id,
            email: data.user.email,
            name: userName,
            role,
            memberKey,
          });
          if (onClose) onClose();
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (memberKey) => {
    const isRafael = memberKey === 'user-1';
    onLoginSuccess({
      id: memberKey,
      email: isRafael ? 'rafael@familia.com' : 'anadebora@familia.com',
      name: isRafael ? 'Rafael' : 'Ana Débora',
      role: isRafael ? 'admin' : 'member',
      memberKey,
    });
    if (onClose) onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isMandatory
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950'
          : 'bg-slate-950/75 backdrop-blur-sm'
      } animate-in fade-in overflow-y-auto`}
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Topo do Modal */}
        <div className="bg-slate-900 text-white p-6 relative">
          {!isMandatory && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center space-x-2 text-blue-400 mb-1">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Acesso Seguro & Familiar</span>
          </div>
          <h3 className="text-xl font-bold">
            {isSignUp ? 'Criar Conta de Acesso' : 'Entrar no Finanças da Família'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isCloud
              ? 'Conectado ao Supabase PostgreSQL na nuvem.'
              : 'Modo local ativo. Você pode entrar em modo simulação.'}
          </p>
        </div>

        {/* Mensagens de Alerta */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Seu Nome</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Rafael ou Ana Débora"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu-email@exemplo.com"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {isSignUp && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-700">Identificação Familiar & Perfil</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedMember('user-1')}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    selectedMember === 'user-1'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <div>Rafael</div>
                  <span className="text-[10px] text-blue-600 uppercase font-semibold">Administrador</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMember('user-2')}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    selectedMember === 'user-2'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <div>Ana Débora</div>
                  <span className="text-[10px] text-purple-600 uppercase font-semibold">Membro Família</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'Processando...' : isSignUp ? 'Concluir Cadastro' : 'Entrar no Sistema'}
          </button>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              {isSignUp ? 'Já tem conta? Fazer Login' : 'Primeiro acesso? Criar conta'}
            </button>

            {!isMandatory && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 font-medium"
              >
                Fechar
              </button>
            )}
          </div>
        </form>

        {/* Atalho Rápido de Acesso */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            {isCloud ? 'Ou acesse em Modo Local (Demonstração / Teste):' : 'Acesso Local / Demonstração:'}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('user-1')}
              className="px-3 py-2 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center space-x-1.5 transition shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Rafael (Admin)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('user-2')}
              className="px-3 py-2 bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center space-x-1.5 transition shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Ana Débora</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
