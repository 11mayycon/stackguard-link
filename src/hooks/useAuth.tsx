import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/profile';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithCpf: (cpf: string) => Promise<{ error: any }>;
  signUpWithCpf: (cpf: string, nomeCompleto: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing profile on mount
    const checkProfile = async () => {
      try {
        const storedProfile = localStorage.getItem('stackguard_profile');
        if (storedProfile) {
          const profileData = JSON.parse(storedProfile);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error loading stored profile:', error);
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, []);

  const signInWithCpf = async (cpf: string) => {
    try {
      // Clean CPF (remove any non-numeric characters)
      const cleanCpf = cpf.replace(/\D/g, '');
      
      // Query profiles table to find user by CPF
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('cpf', cleanCpf)
        .maybeSingle();

      if (error || !profileData) {
        return { error: { message: 'CPF não encontrado no sistema' } };
      }

      // Store profile in state and localStorage
      setProfile(profileData);
      localStorage.setItem('stackguard_profile', JSON.stringify(profileData));
      
      return { error: null };
    } catch (error) {
      return { error: { message: 'Erro ao fazer login' } };
    }
  };

  const signUpWithCpf = async (cpf: string, nomeCompleto: string) => {
    try {
      // Clean CPF
      const cleanCpf = cpf.replace(/\D/g, '');
      
      // Check if CPF already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('cpf', cleanCpf)
        .maybeSingle();

      if (existingProfile) {
        return { error: { message: 'CPF já cadastrado no sistema' } };
      }

      // Create new profile using raw SQL to avoid TypeScript issues
      const { data: newProfile, error } = await supabase.rpc('create_profile_with_cpf', {
        p_cpf: cleanCpf,
        p_nome_completo: nomeCompleto,
        p_role: 'funcionario'
      });

      if (error) {
        return { error: { message: 'Erro ao criar usuário' } };
      }

      return { error: null };
    } catch (error) {
      return { error: { message: 'Erro ao criar usuário' } };
    }
  };

  const signOut = async () => {
    try {
      // Clear profile from state and localStorage
      setProfile(null);
      setUser(null);
      setSession(null);
      localStorage.removeItem('stackguard_profile');
      
      return { error: null };
    } catch (error) {
      return { error: { message: 'Erro ao fazer logout' } };
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signInWithCpf,
    signUpWithCpf,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}