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
    console.log('=== FETCH PROFILE START ===');
    console.log('User ID:', userId);
    
    try {
      console.log('Step 1: Querying profiles table...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('Step 2: Query result:', { data, error });

      if (error) {
        console.log('Step 3: Error occurred:', error);
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        
        if (error.code === 'PGRST116') {
          console.log('Step 4: Profile not found, creating new profile...');
          // Profile doesn't exist, create one
          const { data: { user } } = await supabase.auth.getUser();
          console.log('Step 5: Current user data:', user);
          
          if (user?.user_metadata) {
            console.log('Step 6: Creating profile from metadata:', user.user_metadata);
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
            
            console.log('Step 7: Profile creation result:', { newProfile, insertError });
            
            if (insertError) {
              console.error('Step 8: Profile creation failed:', insertError);
              throw insertError;
            }
            console.log('Step 9: Profile created successfully:', newProfile);
            setProfile(newProfile);
            console.log('Step 10: Profile state updated');
            return newProfile;
          } else {
            console.log('Step 6b: No user metadata, creating default profile');
            // No user metadata, create default profile
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: user?.email || 'unknown@example.com',
                full_name: 'User',
                role: 'lecturer'
              })
              .select()
              .single();
            
            console.log('Step 7b: Default profile creation result:', { newProfile, insertError });
            
            if (insertError) {
              console.error('Step 8b: Default profile creation failed:', insertError);
              throw insertError;
            }
            console.log('Step 9b: Default profile created successfully:', newProfile);
            setProfile(newProfile);
            console.log('Step 10b: Profile state updated');
            return newProfile;
          }
        } else {
          console.log('Step 4b: Other database error occurred');
          // Other error
          console.error('Step 5b: Database error details:', error);
          setProfile(null);
          console.log('Step 6b: Profile set to null');
          throw error;
        }
      } else {
        console.log('Step 3b: Profile found successfully:', data);
        setProfile(data);
        console.log('Step 4b: Profile state updated with existing data');
        return data;
      }
    } catch (error) {
      console.error('=== FETCH PROFILE ERROR ===');
      console.error('Caught error:', error);
      console.error('Error type:', typeof error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      setProfile(null);
      console.log('Profile set to null due to error');
      throw error;
    } finally {
      console.log('=== FETCH PROFILE FINALLY ===');
      console.log('Setting loading to false');
      setLoading(false);
      console.log('Loading state updated to false');
      console.log('=== FETCH PROFILE END ===');
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