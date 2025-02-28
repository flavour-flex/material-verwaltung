import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Prüfen ob ein gültiger Benutzer angemeldet ist
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('temp_password')
        .eq('id', user?.id)
        .single();

      // Wenn kein Benutzer oder kein temporäres Passwort, zur Login-Seite
      if (!user || !userData?.temp_password) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }

    setLoading(true);
    try {
      // Passwort aktualisieren
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      // temp_password Flag zurücksetzen
      const { error: dbError } = await supabase
        .from('users')
        .update({ temp_password: false })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (dbError) throw dbError;

      toast.success('Passwort erfolgreich gesetzt');
      router.push('/login');
    } catch (error) {
      console.error('Error setting password:', error);
      toast.error('Fehler beim Setzen des Passworts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#023770] via-[#034694] to-[#0355b3] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Passwort setzen
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Bitte setzen Sie Ihr neues Passwort
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#023770] focus:border-[#023770] focus:z-10 sm:text-sm"
                placeholder="Passwort"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Passwort bestätigen
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#023770] focus:border-[#023770] focus:z-10 sm:text-sm"
                placeholder="Passwort bestätigen"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#023770] hover:bg-[#034694] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#023770]"
            >
              {loading ? 'Wird gespeichert...' : 'Passwort setzen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 