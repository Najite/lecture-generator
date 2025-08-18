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
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // Don't restore sessions automatically - users must explicitly log in
        setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('Handling SIGNED_IN event');
        try {
          setUser(session.user);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } catch (error) {
          console.error('Error handling sign in:', error);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('Handling SIGNED_OUT event');
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string): Promise<Profile> => {
    console.log('Fetching profile for user:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('Profile query error:', error.code, error.message);
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create one
          console.log('Profile not found, creating new profile');
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            throw userError;
          }
          
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: user.email!,
              full_name: user.user_metadata?.full_name || 'User',
              role: user.user_metadata?.role || 'lecturer'
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('Error creating profile:', insertError);
            throw insertError;
          }
          
          console.log('Profile created successfully:', newProfile);
          setProfile(newProfile);
          setLoading(false);
          setProfile(newProfile);
          return newProfile;
        } else {
          throw error;
        }
      } else {
        console.log('Profile found:', data);
        setProfile(data);
        setLoading(false);
        setProfile(data);
        setLoading(false);
        return data;
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setUser(null);
      setLoading(false);
      setProfile(null);
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
        setLoading(false);
        throw error;
      }
      
      if (!data.user) {
        setLoading(false);
        throw new Error('No user returned from sign in');
      }
      
      console.log('Sign in successful, fetching profile...');
      setUser(data.user);
      
      // Directly fetch the profile
      const userProfile = await fetchProfile(data.user.id);
      setLoading(false);
      
      return { user: data.user, profile: userProfile };
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