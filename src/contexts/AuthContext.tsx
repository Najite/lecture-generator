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
  
  // Use refs to prevent unnecessary re-renders and track initialization
  const userRef = useRef<User | null>(null);
  const profileRef = useRef<Profile | null>(null);
  const initializingRef = useRef(false);
  const initializedRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile> => {
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
  }, []);

  // Separate function to handle user and profile state updates
  const updateUserAndProfile = useCallback(async (newUser: User | null) => {
    console.log('🔄 updateUserAndProfile called with:', newUser?.email || 'null');
    
    if (!newUser) {
      // User signed out
      console.log('🚪 Clearing user and profile state');
      userRef.current = null;
      profileRef.current = null;
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    // Check if this is the same user to avoid unnecessary updates
    if (userRef.current?.id === newUser.id) {
      console.log('🔄 Same user, skipping update');
      setLoading(false);
      return;
    }

    console.log('👤 Updating user and fetching profile for:', newUser.email);
    
    try {
      setLoading(true);
      const userProfile = await fetchProfile(newUser.id);
      
      // Update refs and state
      userRef.current = newUser;
      profileRef.current = userProfile;
      setUser(newUser);
      setProfile(userProfile);
      
      console.log('✅ User and profile updated successfully');
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      // Set user but clear profile on error
      userRef.current = newUser;
      profileRef.current = null;
      setUser(newUser);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    console.log('🔧 AUTH PROVIDER: Initializing...');
    
    // Prevent multiple initializations
    if (initializingRef.current || initializedRef.current) {
      console.log('🔧 Already initialized or initializing, skipping...');
      return;
    }
    
    initializingRef.current = true;
    
    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        console.log('🔧 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting initial session:', error);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('🔄 Found existing session for:', session.user.email);
          await updateUserAndProfile(session.user);
        } else {
          console.log('📭 No existing session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        setLoading(false);
      } finally {
        initializedRef.current = true;
        initializingRef.current = false;
      }
    };
    
    initializeAuth();
    
    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email || 'no user');
      
      // Skip initial session during setup
      if (event === 'INITIAL_SESSION' && !initializedRef.current) {
        console.log('🔄 Skipping INITIAL_SESSION during initialization');
        return;
      }
      
      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
          console.log('✅ Handling SIGNED_IN event');
          if (session?.user) {
            await updateUserAndProfile(session.user);
          }
          break;
          
        case 'SIGNED_OUT':
          console.log('🚪 Handling SIGNED_OUT event');
          await updateUserAndProfile(null);
          break;
          
        case 'TOKEN_REFRESHED':
          console.log('🔄 Token refreshed for user:', session?.user?.email);
          // Only update if it's a different user
          if (session?.user && userRef.current?.id !== session.user.id) {
            await updateUserAndProfile(session.user);
          }
          break;
          
        case 'USER_UPDATED':
          console.log('👤 User updated');
          if (session?.user) {
            await updateUserAndProfile(session.user);
          }
          break;
          
        default:
          console.log('🔄 Unhandled auth event:', event);
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once on mount

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
        setLoading(false);
        throw error;
      }
      
      if (!data.user) {
        setLoading(false);
        throw new Error('No user returned from sign in');
      }
      
      console.log('✅ Sign in successful, auth state change will handle the rest...');
      // Don't call updateUserAndProfile here - let the auth state change handle it
      // The loading state will be managed by the auth state change handler
      
      // Wait for profile to be available
      let attempts = 0;
      const maxAttempts = 10;
      while (attempts < maxAttempts && !profileRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!profileRef.current) {
        throw new Error('Profile not loaded after sign in');
      }
      
      return { user: data.user, profile: profileRef.current };
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'admin' | 'lecturer' = 'lecturer') => {
    console.log('📝 === SIGN UP START ===');
    console.log('📝 Email:', email, 'Role:', role);
    
    try {
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
        console.error('❌ Sign up error:', error);
        throw error;
      }
      
      console.log('✅ Sign up successful', data.user ? 'with immediate user' : 'email confirmation required');
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('🚪 === SIGN OUT START ===');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }
      
      console.log('✅ Sign out complete');
      // Auth state change will handle clearing the state
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      setLoading(false);
      throw error;
    }
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
    loading,
    initialized: initializedRef.current
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}