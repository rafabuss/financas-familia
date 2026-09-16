import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('seu-projeto')
  );
};

// Cliente oficial ou fallback seguro
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// HELPERS DE AUTENTICAÇÃO E PERFIS
// ==========================================

export const getRegisteredMembers = async () => {
  let isRafaelRegistered = false;
  let isAnaRegistered = false;
  const registeredEmails = [];

  // 1. Checar LocalStorage
  try {
    const local = JSON.parse(localStorage.getItem('financas_local_profiles') || '[]');
    if (Array.isArray(local)) {
      if (local.some((p) => p.memberKey === 'user-1')) isRafaelRegistered = true;
      if (local.some((p) => p.memberKey === 'user-2')) isAnaRegistered = true;
      registeredEmails.push(...local.map((p) => p.email?.toLowerCase()).filter(Boolean));
    }
  } catch (e) {
    console.warn('Erro ao ler profiles locais:', e);
  }

  // 2. Checar Supabase se configurado
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('profiles').select('member_key, email, name');
      if (!error && Array.isArray(data)) {
        if (data.some((p) => p.member_key === 'user-1')) isRafaelRegistered = true;
        if (data.some((p) => p.member_key === 'user-2')) isAnaRegistered = true;
        registeredEmails.push(...data.map((p) => p.email?.toLowerCase()).filter(Boolean));
      }
    } catch (e) {
      console.warn('Erro ao consultar profiles do Supabase:', e);
    }
  }

  return {
    isRafaelRegistered,
    isAnaRegistered,
    registeredEmails: Array.from(new Set(registeredEmails)),
  };
};

export const signInWithPassword = async (email, password) => {
  const normEmail = (email || '').trim().toLowerCase();

  if (!isSupabaseConfigured() || !supabase) {
    // Buscar cadastro local como fallback
    try {
      const localProfiles = JSON.parse(localStorage.getItem('financas_local_profiles') || '[]');
      const found = localProfiles.find((p) => p.email?.toLowerCase() === normEmail);
      if (found) {
        if (found.password && found.password !== password) {
          return { data: null, error: { message: 'Senha incorreta.' } };
        }
        return {
          data: {
            user: {
              id: found.id || found.memberKey,
              email: found.email,
              user_metadata: {
                name: found.name,
                role: found.role,
                memberKey: found.memberKey,
              },
            },
          },
          error: null,
        };
      }
    } catch (e) {
      console.warn('Erro ao buscar profile local:', e);
    }

    // Fallback padrão se não houver cadastro local prévio
    const isAna = normEmail.includes('anadebora') || normEmail.includes('ana');
    return {
      data: {
        user: {
          id: isAna ? 'user-2' : 'user-1',
          email: normEmail,
          user_metadata: {
            name: isAna ? 'Ana Débora' : 'Rafael',
            role: isAna ? 'member' : 'admin',
            memberKey: isAna ? 'user-2' : 'user-1',
          },
        },
      },
      error: null,
    };
  }

  // Login no Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normEmail,
    password,
  });

  if (error) {
    let friendlyMessage = error.message;
    if (error.message?.includes('Email not confirmed') || error.message?.includes('not confirmed')) {
      friendlyMessage =
        'E-mail ainda não confirmado. Verifique a caixa de entrada do seu e-mail ou desative "Confirm email" no painel do Supabase (Authentication > Providers > Email).';
    } else if (
      error.message?.includes('Invalid login credentials') ||
      error.message?.includes('invalid_grant')
    ) {
      friendlyMessage =
        'E-mail ou senha incorretos. Verifique os dados digitados ou confirme se o cadastro foi concluído.';
    }
    return { data: null, error: { ...error, message: friendlyMessage } };
  }

  // Buscar perfil complementar no banco
  let profile = await getUserProfile(data.user.id);
  if (!profile) {
    const meta = data.user.user_metadata || {};
    const role = meta.role || (normEmail.includes('anadebora') ? 'member' : 'admin');
    const memberKey = meta.memberKey || (role === 'admin' ? 'user-1' : 'user-2');
    const name = meta.name || (memberKey === 'user-1' ? 'Rafael' : 'Ana Débora');
    try {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: normEmail,
        name,
        role,
        member_key: memberKey,
      });
      profile = { id: data.user.id, email: normEmail, name, role, member_key: memberKey };
    } catch (e) {
      console.warn('Erro ao auto-recuperar profile:', e);
    }
  }

  return {
    data: {
      ...data,
      profile,
    },
    error: null,
  };
};

export const signUpUser = async (email, password, name, role = 'member', memberKey = 'user-1') => {
  const normEmail = (email || '').trim().toLowerCase();

  // Salvar no armazenamento local como fallback
  try {
    const localProfiles = JSON.parse(localStorage.getItem('financas_local_profiles') || '[]');
    if (!localProfiles.some((p) => p.email?.toLowerCase() === normEmail)) {
      localProfiles.push({
        id: memberKey,
        email: normEmail,
        password,
        name,
        role,
        memberKey,
      });
      localStorage.setItem('financas_local_profiles', JSON.stringify(localProfiles));
    }
  } catch (e) {
    console.warn('Erro ao salvar profile local:', e);
  }

  if (!isSupabaseConfigured() || !supabase) {
    return {
      data: {
        user: {
          id: memberKey,
          email: normEmail,
          user_metadata: { name, role, memberKey },
        },
        session: { access_token: 'local-session' },
      },
      error: null,
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: normEmail,
    password,
    options: {
      data: {
        name,
        role,
        memberKey,
      },
    },
  });

  if (error) {
    let friendlyMessage = error.message;
    if (error.message?.includes('already registered') || error.status === 422) {
      friendlyMessage = 'Este e-mail já está cadastrado. Vá para a aba "Já tem conta? Fazer Login".';
    }
    return { data: null, error: { ...error, message: friendlyMessage } };
  }

  if (data?.user) {
    try {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: normEmail,
        name,
        role,
        member_key: memberKey,
      });
    } catch (e) {
      console.warn('Erro ao salvar profile:', e);
    }
  }

  return { data, error: null };
};

export const signOutUser = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    return { error: null };
  }
  return await supabase.auth.signOut();
};

export const getUserProfile = async (userId) => {
  if (!isSupabaseConfigured() || !supabase || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
};

export const onAuthChange = (callback) => {
  if (!isSupabaseConfigured() || !supabase) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
};
