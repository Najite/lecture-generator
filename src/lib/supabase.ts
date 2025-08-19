import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // ✅ Enable session persistence (was false)
    autoRefreshToken: true, // ✅ Automatically refresh tokens (was false)
    detectSessionInUrl: false, // Set to true if using OAuth redirects
    storage: typeof window !== 'undefined' ? window.localStorage : undefined, // Explicitly set storage
  }
  
})

// Admin functions that use service role for elevated permissions
export const createAdminClient = () => {
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey);
  }
  return supabase; // Fallback to regular client
};

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'lecturer';
  created_at: string;
  updated_at: string;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CourseAssignment = {
  id: string;
  course_id: string;
  lecturer_id: string;
  assigned_at: string;
  assigned_by: string;
  course?: Course;
  lecturer?: Profile;
};

export type GeneratedContent = {
  id: string;
  course_id: string;
  lecturer_id: string;
  content_type: string;
  title: string;
  content: string;
  prompt_used: string;
  created_at: string;
  course?: Course;
};