import { createContext, useContext, useState, useEffect } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    role: UserRole;
    isAdmin: boolean;
    isEditor: boolean;
    isViewer: boolean;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch profile from Supabase
    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                // Create a default profile if none exists
                setProfile({
                    id: userId,
                    email: user?.email || '',
                    full_name: user?.email?.split('@')[0] || 'Usuário',
                    role: 'admin',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });
                return;
            }
            setProfile(data as Profile);
        } catch (err) {
            console.error('Profile fetch error:', err);
            setProfile({
                id: userId,
                email: user?.email || '',
                full_name: 'Usuário',
                role: 'admin',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            setSession(s);
            setUser(s?.user ?? null);
            if (s?.user) {
                fetchProfile(s.user.id);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, s) => {
                setSession(s);
                setUser(s?.user ?? null);
                if (s?.user) {
                    fetchProfile(s.user.id);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message || 'Erro ao fazer login' };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    const role = profile?.role || 'viewer';

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                role,
                isAdmin: role === 'admin',
                isEditor: role === 'editor',
                isViewer: role === 'viewer',
                isAuthenticated: !!user,
                loading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
