import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Trash2,
  UserPlus,
  Check,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Wallet,
  X,
  Sparkles,
  ArrowRight,
  Info,
  Pencil,
} from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';
import { formatMoney } from '../../utils/formatters';

export default function FamilyManagementModal({
  isOpen,
  onClose,
  initialTab = 'members',
  selectedMemberIdForMatrix = null,
}) {
  const finance = useFinance();
  const {
    currentUser,
    familyName,
    handleUpdateFamilyName,
    householdMembers = [],
    accounts = [],
    handleSaveMemberPermissions,
    handleToggleMemberStatus,
    handleRemoveMember,
    handleAddMember,
    handleSwitchDemoUser,
    isDemoModeState,
    isDemoMode,
  } = finance;

  const [isEditingFamilyName, setIsEditingFamilyName] = useState(false);
  const [tempFamilyName, setTempFamilyName] = useState(familyName || 'Nicácio Ferreira');

  useEffect(() => {
    if (familyName) setTempFamilyName(familyName);
  }, [familyName]);

  const handleSaveFamilyName = async () => {
    const trimmed = tempFamilyName.trim();
    if (!trimmed) return;
    await handleUpdateFamilyName(trimmed);
    setIsEditingFamilyName(false);
  };

  const [activeTab, setActiveTab] = useState(initialTab); // 'members' | 'matrix'
  const [selectedMemberId, setSelectedMemberId] = useState('');
  
  // Permissões em edição (staged)
  const [stagedVisibleEntities, setStagedVisibleEntities] = useState([]);
  const [stagedHiddenAccountIds, setStagedHiddenAccountIds] = useState([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  
  // Estado para adicionar novo membro
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member'); // 'member' | 'admin'
  const [newMemberColor, setNewMemberColor] = useState('#2563eb');
  
  // Confirmação de exclusão de membro
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Inicializar membro selecionado quando o modal abrir ou a lista mudar
  useEffect(() => {
    if (!isOpen) return;
    if (selectedMemberIdForMatrix) {
      setSelectedMemberId(selectedMemberIdForMatrix);
      setActiveTab('matrix');
      return;
    }
    // Se não houver seleção prévia, seleciona o primeiro membro que não seja o próprio admin ou o primeiro da lista
    if (householdMembers.length > 0) {
      const nonAdmin = householdMembers.find(
        (m) => m.role !== 'admin' || (m.memberKey !== 'user-1' && m.id !== currentUser?.id)
      );
      setSelectedMemberId((prev) => {
        if (prev && householdMembers.some((m) => m.id === prev)) return prev;
        return nonAdmin?.id || householdMembers[0]?.id;
      });
    }
  }, [isOpen, selectedMemberIdForMatrix, householdMembers]);

  // Membro atualmente selecionado no Combobox (com fallback seguro)
  const currentConfiguringMember =
    householdMembers.find((m) => m.id === selectedMemberId) || householdMembers[0];

  // Carregar as permissões do membro selecionado no combobox
  useEffect(() => {
    const member = householdMembers.find((m) => m.id === selectedMemberId) || currentConfiguringMember;
    if (member) {
      setStagedVisibleEntities(Array.isArray(member.visibleEntities) ? [...member.visibleEntities] : ['family-shared']);
      setStagedHiddenAccountIds(Array.isArray(member.hiddenAccountIds) ? [...member.hiddenAccountIds] : []);
    }
  }, [selectedMemberId, householdMembers, currentConfiguringMember]);

  if (!isOpen) return null;

  // Alternar checkbox de visibilidade de entidade/membro
  const handleToggleEntityCheck = (entityKey) => {
    setStagedVisibleEntities((prev) => {
      if (prev.includes(entityKey)) {
        return prev.filter((k) => k !== entityKey);
      } else {
        return [...prev, entityKey];
      }
    });
  };

  // Alternar checkbox de ocultação de conta bancária
  const handleToggleAccountHidden = (accId) => {
    setStagedHiddenAccountIds((prev) => {
      if (prev.includes(accId)) {
        return prev.filter((id) => id !== accId);
      } else {
        return [...prev, accId];
      }
    });
  };

  // Salvar permissões configuradas
  const handleSaveStagedPermissions = async () => {
    if (!selectedMemberId) return;
    setIsSaving(true);
    setSaveSuccessMsg('');
    try {
      await handleSaveMemberPermissions(selectedMemberId, {
        visibleEntities: stagedVisibleEntities,
        hiddenAccountIds: stagedHiddenAccountIds,
      });
      setSaveSuccessMsg(`Permissões de ${currentConfiguringMember?.displayName || 'membro'} salvas com sucesso!`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      alert('Erro ao salvar permissões: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // Submeter criação de novo membro
  const handleCreateMemberSubmit = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      alert('Informe o nome do membro.');
      return;
    }
    const memberKey = `user-${Date.now().toString(36)}`;
    await handleAddMember({
      displayName: newMemberName.trim(),
      email: newMemberEmail.trim() || `${newMemberName.toLowerCase().replace(/\s+/g, '')}@familia.com`,
      role: newMemberRole,
      color: newMemberColor,
      status: 'active',
      memberKey,
      visibleEntities: newMemberRole === 'admin' ? ['family-shared', 'user-all', memberKey] : [memberKey],
      hiddenAccountIds: [],
    });
    setNewMemberName('');
    setNewMemberEmail('');
    setShowAddMemberForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Cabeçalho do Modal */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 shrink-0 relative border-b border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2.5 text-blue-400 mb-1.5">
            <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
              Painel Administrativo da Família
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 flex-wrap">
            <span>Gestão da Família & Controle de Acesso</span>
            <span className="text-xs sm:text-sm font-medium text-blue-300 bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-800/40">
              {familyName || 'Nicácio Ferreira'}
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Gerencie participantes, realize suspensões temporárias e configure a matriz granular de visibilidade para cada membro.
          </p>

          {/* Navegação entre Abas do Painel */}
          <div className="flex items-center gap-2 mt-5">
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Membros & Moderação</span>
              <span className="ml-1 px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
                {householdMembers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Matriz Visual de Permissões</span>
            </button>
          </div>
        </div>

        {/* Corpo com Rolagem */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* ========================================================================= */}
          {/* ABA 1: MEMBROS DA FAMÍLIA & MODERAÇÃO */}
          {/* ========================================================================= */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              {/* Barra de Ação Superior */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <div>
                  {isEditingFamilyName ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">Família:</span>
                      <input
                        type="text"
                        value={tempFamilyName}
                        onChange={(e) => setTempFamilyName(e.target.value)}
                        placeholder="Nome da família"
                        className="px-2.5 py-1 text-sm font-bold border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 shadow-xs"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveFamilyName();
                          if (e.key === 'Escape') setIsEditingFamilyName(false);
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveFamilyName}
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                        title="Salvar nome da família"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTempFamilyName(familyName || 'Nicácio Ferreira');
                          setIsEditingFamilyName(false);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900">
                        Participantes da família '{familyName || 'Nicácio Ferreira'}'
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setTempFamilyName(familyName || 'Nicácio Ferreira');
                          setIsEditingFamilyName(true);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title="Editar nome da família"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">
                    Administre o status de acesso e papéis de cada participante da família.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMemberForm(!showAddMemberForm)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{showAddMemberForm ? 'Cancelar' : 'Convidar / Adicionar Membro'}</span>
                </button>
              </div>

              {/* Formulário Inline de Adição de Membro */}
              {showAddMemberForm && (
                <form
                  onSubmit={handleCreateMemberSubmit}
                  className="p-4 sm:p-5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-4 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-blue-600" />
                      Novo Membro da Família
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddMemberForm(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Fechar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nome Completo</label>
                      <input
                        type="text"
                        required
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="Ex: Alice (Filha) ou Pedro"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">E-mail (opcional)</label>
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="alice@familia.com"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Papel na Família</label>
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      >
                        <option value="member">Membro / Dependente</option>
                        <option value="admin">Administrador Titular</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Cor Identificadora</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={newMemberColor}
                          onChange={(e) => setNewMemberColor(e.target.value)}
                          className="w-9 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer"
                        />
                        <span className="text-[11px] text-slate-500 font-mono">{newMemberColor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddMemberForm(false)}
                      className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      Cadastrar Membro
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Membros da Família */}
              <div className="space-y-3">
                {householdMembers.map((member) => {
                  const isCurrentAdmin = member.id === currentUser?.id || (currentUser?.memberKey === member.memberKey && member.role === 'admin');
                  const isSuspended = member.status === 'suspended';

                  return (
                    <div
                      key={member.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isSuspended
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      } flex flex-col md:flex-row md:items-center justify-between gap-4`}
                    >
                      {/* Lado Esquerdo: Avatar + Dados */}
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-sm shrink-0 select-none ring-2 ring-white"
                          style={{ backgroundColor: member.color || '#2563eb' }}
                        >
                          {member.displayName?.[0]?.toUpperCase() || 'M'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                              {member.displayName}
                            </h5>
                            {isCurrentAdmin && (
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
                                Você
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                member.role === 'admin'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {member.role === 'admin' ? '👑 Administrador' : '👤 Membro'}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                                isSuspended
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSuspended ? 'bg-rose-600' : 'bg-emerald-500'
                                }`}
                              />
                              <span>{isSuspended ? 'Acesso Suspenso' : 'Ativo'}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                            {member.email && <span>{member.email}</span>}
                            <span>•</span>
                            <span className="text-slate-400">
                              Visibilidade:{' '}
                              <strong className="text-slate-700">
                                {(member.visibleEntities || []).length} entidades
                              </strong>
                            </span>
                            {(member.hiddenAccountIds || []).length > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-amber-700 font-medium">
                                  {member.hiddenAccountIds.length} conta(s) oculta(s)
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: Ações de Moderação */}
                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
                        {/* Botão de Atalho para Configurar Matriz */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMemberId(member.id);
                            setActiveTab('matrix');
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                          title="Abrir matriz de permissões deste membro"
                        >
                          <Shield className="w-3.5 h-3.5 text-blue-600" />
                          <span>Permissões</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </button>

                        {/* Botão de Simulação em Modo Demonstração */}
                        {(isDemoModeState || isDemoMode()) && handleSwitchDemoUser && (
                          <button
                            type="button"
                            onClick={() => {
                              handleSwitchDemoUser(member.memberKey || member.id);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                            title="Simular visualização como este membro no app"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span className="hidden sm:inline">Simular Visão</span>
                          </button>
                        )}

                        {/* Ação de Bloqueio/Desbloqueio (desativada para si próprio) */}
                        {!isCurrentAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleToggleMemberStatus(member.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-2xs cursor-pointer ${
                              isSuspended
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                            }`}
                            title={isSuspended ? 'Restabelecer acesso imediato' : 'Suspender acesso temporariamente'}
                          >
                            {isSuspended ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Desbloquear</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 text-amber-700" />
                                <span>Bloquear Acesso</span>
                              </>
                            )}
                          </button>
                        ) : null}

                        {/* Ação de Remoção com Confirmação */}
                        {!isCurrentAdmin && (
                          <button
                            type="button"
                            onClick={() => setMemberToDelete(member)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Remover permanentemente da família"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Alerta de Confirmação de Remoção */}
              {memberToDelete && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                  <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center space-x-3 text-rose-600">
                      <div className="p-2 bg-rose-100 rounded-xl">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900">Remover Membro da Família</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Tem certeza que deseja remover <strong>{memberToDelete.displayName}</strong> ({memberToDelete.email || 'membro'}) da família? O usuário perderá imediatamente todo o acesso às contas, cartões e registros compartilhados.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setMemberToDelete(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleRemoveMember(memberToDelete.id);
                          setMemberToDelete(null);
                        }}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        Sim, Remover Membro
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 2: MATRIZ VISUAL DE PERMISSÕES */}
          {/* ========================================================================= */}
          {activeTab === 'matrix' && (
            <div className="space-y-6">
              {/* No Topo: Combobox / Dropdown de Seleção de Membro */}
              <div className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label
                      htmlFor="matrix-member-select"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1"
                    >
                      Configurando permissões do membro:
                    </label>
                    <div className="flex items-center space-x-3">
                      <select
                        id="matrix-member-select"
                        value={selectedMemberId || currentConfiguringMember?.id || ''}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                        className="bg-white border border-slate-300 text-slate-900 font-bold text-sm sm:text-base rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer shadow-xs min-w-[240px]"
                      >
                        {householdMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.displayName} ({m.role === 'admin' ? 'Admin' : 'Membro'} • {m.email || m.memberKey || 'Sem email'})
                          </option>
                        ))}
                      </select>

                      {currentConfiguringMember?.status === 'suspended' && (
                        <span className="text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Status: Acesso Suspenso</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Feedback de salvamento */}
                  {saveSuccessMsg && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center space-x-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{saveSuccessMsg}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Defina quais pessoas e entidades <strong>{currentConfiguringMember?.displayName || 'este membro'}</strong> tem autorização para visualizar. Se desmarcar uma entidade, os lançamentos, cartões e patrimônio associados ficarão 100% invisíveis para ele.
                </p>
              </div>

              {/* Tabela Dinâmica de Permissões de Visibilidade */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Matriz de Visibilidade de Gastos & Entidades
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Marque os checks para conceder acesso
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* Linha 1: Família (Gastos Compartilhados) */}
                  <label
                    htmlFor="chk-entity-family-shared"
                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0 pr-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                        🏠
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            Família (Gastos Compartilhados)
                          </span>
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            Escopo Familiar
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Visualizar lançamentos de despesas conjuntas da casa (aluguel, condomínio, mercado) e visão de patrimônio consolidado.
                        </p>
                      </div>
                    </div>

                    <input
                      id="chk-entity-family-shared"
                      type="checkbox"
                      checked={stagedVisibleEntities.includes('family-shared')}
                      onChange={() => handleToggleEntityCheck('family-shared')}
                      className="w-5 h-5 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                    />
                  </label>

                  {/* Linhas 2..N: Membros da Família */}
                  {householdMembers.map((member) => {
                    const memberKey = member.memberKey || member.id;
                    const isConfiguringSelf = member.id === selectedMemberId;
                    const isChecked = stagedVisibleEntities.includes(memberKey) || stagedVisibleEntities.includes(member.id);

                    return (
                      <label
                        key={member.id}
                        htmlFor={`chk-entity-${member.id}`}
                        className={`p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                          isConfiguringSelf ? 'bg-blue-50/20' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3.5 min-w-0 pr-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-xs ring-2 ring-white"
                            style={{ backgroundColor: member.color || '#2563eb' }}
                          >
                            {member.displayName?.[0]?.toUpperCase() || 'M'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">
                                {member.displayName}
                              </span>
                              {isConfiguringSelf && (
                                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  Próprio Membro
                                </span>
                              )}
                              <span className="text-[10px] font-semibold text-slate-500 uppercase">
                                {member.role === 'admin' ? 'Administrador' : 'Membro'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {isConfiguringSelf
                                ? 'Visualizar os próprios lançamentos e cartões pessoais.'
                                : `Visualizar lançamentos pessoais e extrato individual de ${member.displayName}.`}
                            </p>
                          </div>
                        </div>

                        <input
                          id={`chk-entity-${member.id}`}
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleEntityCheck(memberKey)}
                          className="w-5 h-5 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Seção 2: Contas Bancárias & Carteiras Sensíveis (Ocultar para este membro) */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Ocultar Contas Bancárias & Carteiras Sensíveis
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Marque para ocultar a conta deste membro
                  </span>
                </div>

                <div className="p-4 bg-amber-50/50 border-b border-amber-100 text-xs text-amber-900 flex items-start space-x-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Contas marcadas como <strong>ocultas</strong> não aparecerão na aba Contas deste membro e seus saldos não serão somados no patrimônio visível por ele.
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {accounts.map((acc) => {
                    const isHidden = stagedHiddenAccountIds.includes(acc.id);

                    return (
                      <label
                        key={acc.id}
                        htmlFor={`chk-hide-acc-${acc.id}`}
                        className={`p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                          isHidden ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0 pr-3">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: acc.color || '#2563eb' }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{acc.name}</span>
                              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">
                                {acc.type || 'corrente'}
                              </span>
                              <span className="text-xs text-slate-400">({acc.bank})</span>
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              Titular: {acc.holder || 'Família'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span
                            className={`text-xs font-semibold ${
                              isHidden ? 'text-rose-600' : 'text-slate-400'
                            }`}
                          >
                            {isHidden ? 'Oculta para o membro' : 'Visível'}
                          </span>
                          <input
                            id={`chk-hide-acc-${acc.id}`}
                            type="checkbox"
                            checked={isHidden}
                            onChange={() => handleToggleAccountHidden(acc.id)}
                            className="w-5 h-5 text-rose-600 rounded-md border-slate-300 focus:ring-rose-500 cursor-pointer"
                          />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Barra de Ação Inferior: Botão Salvar Permissões */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500">
                  {stagedVisibleEntities.length === 0 ? (
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Nenhuma entidade marcada. O membro não verá nenhum lançamento.
                    </span>
                  ) : (
                    <span>
                      Total selecionado: <strong>{stagedVisibleEntities.length}</strong> entidades autorizadas • <strong>{stagedHiddenAccountIds.length}</strong> contas ocultadas.
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveStagedPermissions}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition shadow-md shadow-blue-900/30 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? (
                      <span>Salvando...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Salvar Permissões</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
