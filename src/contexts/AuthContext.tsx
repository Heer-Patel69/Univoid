import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, UserRole, AppRole } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole;
  isAdmin: boolean;
  isOrganizer: boolean;
  isLoading: boolean;
  signUp: (data: SignUpData) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  uploadProfilePhoto: (file: File) => Promise<{ url: string | null; error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  college_name: string;
  course_stream: string;
  year_semester: string;
  mobile_number?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole>('student');
  const [isLoading, setIsLoading] = useState(true);

  const [userRoles, setUserRoles] = useState<string[]>([]);

  // Sync OAuth user verification status to profiles table
  const syncOAuthVerification = async (authUser: User) => {
    const provider = authUser.app_metadata?.provider;
    const isOAuthUser = (provider && provider !== 'email') || 
      authUser.identities?.some((identity: any) => identity.provider && identity.provider !== 'email');
    
    if (isOAuthUser) {
      // Auto-mark OAuth users as email verified in profiles table
      await supabase
        .from('profiles')
        .update({ email_verified: true })
        .eq('id', authUser.id);
      console.log('OAuth user verification synced to profiles table');
    }
  };

  const fetchUserData = async (userId: string, authUser?: User) => {
    // If OAuth user, sync verification status first
    if (authUser) {
      await syncOAuthVerification(authUser);
    }

    const [profileResult, roleResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);

    // If no profile exists, create one (fallback for OAuth users)
    if (!profileResult.data && authUser) {
      console.log('No profile found, creating one for user:', userId);
      const newProfile = {
        id: userId,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || 
                   authUser.user_metadata?.name || 
                   authUser.email?.split('@')[0] || 'User',
        college_name: authUser.user_metadata?.college_name || null,
        course_stream: authUser.user_metadata?.course_stream || null,
        year_semester: authUser.user_metadata?.year_semester || null,
        mobile_number: authUser.user_metadata?.mobile_number || null,
        email_verified: true, // OAuth users are verified
        profile_complete: false,
      };
      
      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .upsert(newProfile, { onConflict: 'id' })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating profile:', createError);
      } else {
        setProfile(createdProfile as Profile);
      }
    } else if (profileResult.data) {
      setProfile(profileResult.data as Profile);
    }

    if (roleResult.data && roleResult.data.length > 0) {
      const roles = roleResult.data.map(r => r.role);
      setUserRoles(roles);
      const hasAdmin = roles.includes('admin');
      const hasOrganizer = roles.includes('organizer');
      setRole(hasAdmin ? 'admin' : hasOrganizer ? 'organizer' : (roleResult.data[0].role as AppRole));
    } else {
      setUserRoles([]);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let hasInitialized = false;

    // Safety timeout - never block app for more than 8 seconds
    const safetyTimeout = setTimeout(() => {
      if (isMounted && isLoading && !hasInitialized) {
        console.warn('Auth loading timeout - proceeding without auth');
        setIsLoading(false);
        hasInitialized = true;
      }
    }, 8000);

    // Set up auth state listener FIRST (synchronous callback - no async)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        // Synchronous state updates only
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer data fetching with setTimeout to avoid deadlocks
          setTimeout(() => {
            if (isMounted) {
              fetchUserData(session.user.id, session.user).catch(console.error);
            }
          }, 0);
        } else {
          setProfile(null);
          setRole('student');
          setUserRoles([]);
        }
        
        // Mark loading as complete after auth state change
        if (!hasInitialized) {
          hasInitialized = true;
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserData(session.user.id, session.user);
        }
        
        hasInitialized = true;
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (data: SignUpData): Promise<{ error: Error | null }> => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: data.full_name,
          college_name: data.college_name,
          course_stream: data.course_stream,
          year_semester: data.year_semester,
          mobile_number: data.mobile_number || null,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error as Error };
    }

    // Check if user is disabled
    if (data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_disabled')
        .eq('id', data.user.id)
        .single();

      if (profileData?.is_disabled) {
        await supabase.auth.signOut();
        return { error: new Error('Your account has been disabled. Please contact support.') };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole('student');
  };

  const updateProfile = async (data: Partial<Profile>): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...data });
    }

    return { error: error as Error | null };
  };

  const uploadProfilePhoto = async (file: File): Promise<{ url: string | null; error: Error | null }> => {
    if (!user) return { url: null, error: new Error('Not authenticated') };

    // Compress image if needed (basic resize for large images)
    const compressedFile = await compressImage(file);
    
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, compressedFile);

    if (uploadError) {
      return { url: null, error: uploadError as Error };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    // Update profile in database (this works for both email and Google users)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_photo_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      return { url: null, error: updateError as Error };
    }

    // Update local profile state immediately
    if (profile) {
      setProfile({ ...profile, profile_photo_url: publicUrl });
    }

    return { url: publicUrl, error: null };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id, user);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    role,
    isAdmin: role === 'admin' || userRoles.includes('admin'),
    isOrganizer: role === 'organizer' || userRoles.includes('organizer') || userRoles.includes('admin'),
    isLoading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    uploadProfilePhoto,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to compress images
async function compressImage(file: File, maxWidth = 800): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.8
      );
    };
    img.src = URL.createObjectURL(file);
  });
}
