import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [verantwortlicherStandorte, setVerantwortlicherStandorte] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          if (isMounted) {
            setUser(null);
            setUserRole(null);
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

          // Standorte für Standortverantwortliche abrufen
          if (userData?.role === 'standortverantwortlich' && session.user.email) {
            const { data: standorte, error: standorteError } = await supabase
              .from('standorte')
              .select('id, verantwortliche');
            
            if (!standorteError && standorte && isMounted) {
              const zugewieseneStandorte = standorte
                .filter(standort => 
                  Array.isArray(standort.verantwortliche) && 
                  standort.verantwortliche.includes(session.user.email)
                )
                .map(s => s.id);
              
              setVerantwortlicherStandorte(zugewieseneStandorte);
            } else if (standorteError) {
              console.error('Error fetching standorte:', standorteError);
            }
          }
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(fetchUserData);

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