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
  const [loading, setLoading] = useState(false); // Start with false, no auto-loading

  useEffect(() => {
    console.log('🔧 AUTH PROVIDER: Initializing...');
    
    // Don't restore sessions automatically - users must explicitly log in
    setLoading(false);
    
    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email || 'no user');
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ Handling SIGNED_IN event');
        setLoading(true);
        setUser(session.user);
        
        try {
          const userProfile = await fetchProfile(session.user.id);
          console.log('✅ Profile fetched successfully:', userProfile);
          setProfile(userProfile);
        } catch (error) {
          console.error('❌ Error fetching profile after sign in:', error);
          setUser(null);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 Handling SIGNED_OUT event');
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string): Promise<Profile> => {
    console.log('📋 === FETCH PROFILE START ===');
    console.log('📋 User ID:', userId);
    
    try {
      console.log('📋 Step 1: Querying profiles table...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('📋 Step 2: Query completed');
      console.log('📋 Data received:', data);
      console.log('📋 Error received:', error);

      if (error) {
        console.log('📋 Step 3: Handling error...');
        if (error.code === 'PGRST116') {
          console.log('📋 Step 4: Profile not found, creating new profile...');
          
          // Get user data for profile creation
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('❌ Error getting user data:', userError);
            throw userError;
          }
          
          if (!user) {
            throw new Error('No user data available for profile creation');
          }
          
          console.log('📋 Step 5: Creating profile with user data:', {
            id: userId,
            email: user.email,
            full_name: user.user_metadata?.full_name,
            role: user.user_metadata?.role
          });
          
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
            console.error('❌ Error creating profile:', insertError);
            throw insertError;
          }
          
          console.log('✅ Profile created successfully:', newProfile);
          return newProfile;
        } else {
          console.error('❌ Database error:', error);
          throw error;
        }
      } else {
        console.log('✅ Profile found:', data);
        return data;
      }
    } catch (error: any) {
      console.error('❌ === FETCH PROFILE ERROR ===');
      console.error('❌ Error details:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<{ user: User; profile: Profile }> => {
    console.log('🔐 === SIGN IN START ===');
    console.log('🔐 Email:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('❌ Sign in error:', error);
        throw error;
      }
      
      if (!data.user) {
        throw new Error('No user returned from sign in');
      }
      
      console.log('✅ Sign in successful, setting user...');
      setUser(data.user);
      
      console.log('📋 Fetching profile...');
      const userProfile = await fetchProfile(data.user.id);
      setProfile(userProfile);
      
      console.log('✅ Sign in complete');
      return { user: data.user, profile: userProfile };
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      setUser(null);
      setProfile(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'admin' | 'lecturer' = 'lecturer') => {
    console.log('📝 === SIGN UP START ===');
    console.log('📝 Email:', email, 'Role:', role);
    
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
    
    if (error) {
      console.error('❌ Sign up error:', error);
      throw error;
    }
    
    console.log('✅ Sign up successful');
  };

  const signOut = async () => {
    console.log('🚪 === SIGN OUT START ===');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
    
    setUser(null);
    setProfile(null);
    console.log('✅ Sign out complete');
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

  console.log('🔍 AUTH CONTEXT STATE:', {
    hasUser: !!user,
    userEmail: user?.email,
    hasProfile: !!profile,
    profileRole: profile?.role,
    loading
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}