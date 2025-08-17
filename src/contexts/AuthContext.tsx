import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User; profile: Profile }>;
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
      console.log('Initial session:', session?.user?.email);
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

  const fetchProfile = async (userId: string): Promise<Profile> => {
    try {
      console.log('Fetching profile for user:', userId);
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('Profile fetch error:', error);
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create one
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
            
            if (insertError) {
              console.error('Error creating profile:', insertError);
              setLoading(false);
              throw insertError;
            }
            console.log('Profile created:', newProfile);
            setProfile(newProfile);
            setLoading(false);
            return newProfile;
          }
        }
        setLoading(false);
        throw error;
      } else {
        console.log('Profile fetched:', data);
        setProfile(data);
        setLoading(false);
        return data;
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setLoading(false);
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<{ user: User; profile: Profile }> => {
    console.log('Signing in user:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      
      if (!data.user) {
        throw new Error('No user returned from sign in');
      }
      
      console.log('Sign in successful, fetching profile...');
      const profile = await fetchProfile(data.user.id);
      
      return { user: data.user, profile };
    } catch (error) {
      setLoading(false);
      throw error;
    }
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
    setUser(null);
    setProfile(null);
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