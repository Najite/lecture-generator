import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  
  // Performance optimization: Use refs to prevent unnecessary operations
  const currentUserIdRef = useRef<string | null>(null);
  const initializingRef = useRef(false);
  const profileCacheRef = useRef<Map<string, Profile>>(new Map());

  // Memoized profile fetcher with caching
  const fetchProfile = useCallback(async (userId: string): Promise<Profile> => {
    // Check cache first
    const cachedProfile = profileCacheRef.current.get(userId);
    if (cachedProfile) {
      return cachedProfile;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Create profile if not exists
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !user) {
            throw userError || new Error('No user data available for profile creation');
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
            throw insertError;
          }
          
          // Cache the new profile
          profileCacheRef.current.set(userId, newProfile);
          return newProfile;
        } else {
          throw error;
        }
      }
      
      // Cache the fetched profile
      profileCacheRef.current.set(userId, data);
      return data;
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }, []);

  // Optimized user and profile update function
  const updateUserAndProfile = useCallback(async (newUser: User | null) => {
    const newUserId = newUser?.id || null;
    
    // Early return if same user (prevents unnecessary re-renders)
    if (currentUserIdRef.current === newUserId) {
      return;
    }

    // Handle sign out
    if (!newUser) {
      currentUserIdRef.current = null;
      setUser(null);
      setProfile(null);
      return;
    }

    try {
      setLoading(true);
      const userProfile = await fetchProfile(newUser.id);
      
      // Batch state updates to prevent multiple re-renders
      currentUserIdRef.current = newUser.id;
      setUser(newUser);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      // Keep user state, just clear profile on error
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    // Prevent duplicate initialization
    if (initializingRef.current) {
      return;
    }
    
    initializingRef.current = true;
    
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          await updateUserAndProfile(session.user);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      } finally {
        initializingRef.current = false;
      }
    };
    
    initializeAuth();
    
    // Optimized auth state change handler
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip initial session during initialization
      if (initializingRef.current && event === 'INITIAL_SESSION') {
        return;
      }
      
      switch (event) {
        case 'SIGNED_IN':
        case 'USER_UPDATED':
          if (session?.user) {
            await updateUserAndProfile(session.user);
          }
          break;
          
        case 'SIGNED_OUT':
          await updateUserAndProfile(null);
          break;
          
        case 'TOKEN_REFRESHED':
          // Only update if it's a different user (edge case)
          if (session?.user && currentUserIdRef.current !== session.user.id) {
            await updateUserAndProfile(session.user);
          }
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [updateUserAndProfile]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ user: User; profile: Profile }> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error || !data.user) {
        throw error || new Error('No user returned from sign in');
      }
      
      // The auth state change handler will update the context
      // But we need to return the profile for immediate use
      const userProfile = await fetchProfile(data.user.id);
      
      return { user: data.user, profile: userProfile };
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: 'admin' | 'lecturer' = 'lecturer') => {
    const { data, error } = await supabase.auth.signUp({
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
      throw error;
    }
    
    return data;
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      // Clear cache on sign out
      profileCacheRef.current.clear();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, []);

  // Memoized context value to prevent unnecessary re-renders of consumers
  const contextValue = React.useMemo(() => ({
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: profile?.role === 'admin',
    isLecturer: profile?.role === 'lecturer',
  }), [user, profile, loading, signIn, signUp, signOut]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}