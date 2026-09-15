import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
// HELPERS DE AUTENTICAÇÃO
// ==========================================

export const signInWithPassword = async (email, password) => {
  if (!isSupabaseConfigured() || !supabase) {
    // Simulação local caso Supabase não esteja conectado
    return {
      data: {
        user: {
          id: email.includes('anadebora') ? 'user-2' : 'user-1',
          email,
          user_metadata: {
            name: email.includes('anadebora') ? 'Ana Débora' : 'Rafael',
            role: email.includes('anadebora') ? 'member' : 'admin',
            memberKey: email.includes('anadebora') ? 'user-2' : 'user-1',
          },
        },
      },
      error: null,
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { data: null, error };

  // Buscar perfil complementar no banco
  const profile = await getUserProfile(data.user.id);
  return {
    data: {
      ...data,
      profile,
    },
    error: null,
  };
};

export const signUpUser = async (email, password, name, role = 'member', memberKey = 'user-1') => {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      data: {
        user: {
          id: memberKey,
          email,
          user_metadata: { name, role, memberKey },
        },
      },
      error: null,
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
        memberKey,
      },
    },
  });

  if (error) return { data: null, error };

  if (data?.user) {
    // Registrar na tabela profiles
    try {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
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
