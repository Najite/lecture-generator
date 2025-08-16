import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role?: 'admin' | 'lecturer') => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isLecturer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log('Fetching profile for user:', userId);
    try {
      // First try to get profile directly
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('Profile fetch error:', error);
        // If profile doesn't exist, create it from user metadata
        if (error.code === 'PGRST116') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.user_metadata) {
            console.log('Creating profile from metadata:', user.user_metadata);
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: user.email!,
                full_name: user.user_metadata.full_name || 'User',
                role: user.user_metadata.role || 'lecturer'
              })
              .select()
              .single();
            
            if (insertError) throw insertError;
            setProfile(newProfile);
            console.log('Profile created:', newProfile);
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      } else {
        setProfile(data);
        console.log('Profile loaded:', data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Try to create a basic profile if none exists
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: user.email!,
              full_name: user.email?.split('@')[0] || 'User',
              role: 'lecturer'
            })
            .select()
            .single();
          
          if (!insertError) {
            setProfile(newProfile);
            console.log('Basic profile created:', newProfile);
          } else {
            setProfile(null);
          }
        }
      } catch (createError) {
        console.error('Failed to create basic profile:', createError);
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    console.log('Sign in result:', { data: data.user?.email, error });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'admin' | 'lecturer' = 'lecturer') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: profile?.role === 'admin',
    isLecturer: profile?.role === 'lecturer',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}