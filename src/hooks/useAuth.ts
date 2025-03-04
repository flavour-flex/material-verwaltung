import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [verantwortlicherStandorte, setVerantwortlicherStandorte] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          if (isMounted) {
            setUser(null);
            setUserRole(null);
            setIsLoading(false);
          }
          return;
        }

        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        if (isMounted) {
          setUser(session.user);
          setUserRole(userData?.role || null);
          
          if (userData?.role === 'standortverantwortlich' && session.user.email) {
            const { data: standorte, error: standorteError } = await supabase
              .from('standorte')
              .select('id')
              .contains('verantwortliche', [{ email: session.user.email }]);
            
            if (!standorteError && standorte) {
              setVerantwortlicherStandorte(standorte.map(s => s.id));
            }
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error);
        if (isMounted) {
          setUser(null);
          setUserRole(null);
          setIsLoading(false);
        }
      }
    };

    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          setUserRole(null);
          setVerantwortlicherStandorte([]);
        }
      }
      fetchUserData();
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return {
    user,
    userRole,
    verantwortlicherStandorte,
    isAdmin: userRole === 'admin',
    isStandortverantwortlich: userRole === 'standortverantwortlich',
    isLoading,
    isAuthenticated: !!user
  };
} 