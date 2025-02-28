import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email')?.toString().trim();
      const password = formData.get('password')?.toString();

      if (!email || !password) {
        throw new Error('Bitte E-Mail und Passwort eingeben');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Nach erfolgreichem Login manuell weiterleiten
      const redirectPath = isAdmin ? '/dashboard' : '/bestellungen/neu';
      router.push(redirectPath);

    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Anmeldung fehlgeschlagen');
      toast.error('Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Statische Positionen für die Animationen */}
      <motion.div
        className="absolute bg-blue-100/10 rounded-full"
        initial={{ x: -100, y: -100 }}
        animate={{ x: 0, y: 0 }}
        style={{
          width: '300px',
          height: '300px',
          left: '20%',
          top: '20%',
        }}
      />
      <motion.div
        className="absolute bg-blue-100/10 rounded-full"
        initial={{ x: 100, y: 100 }}
        animate={{ x: 0, y: 0 }}
        style={{
          width: '250px',
          height: '250px',
          right: '20%',
          bottom: '20%',
        }}
      />

      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg relative z-10">
        <div className="text-center">
          <motion.img
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            src="/logo.png"
            alt="Logo"
            className="h-12 mx-auto mb-6"
          />
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-[#023770]"
          >
            Willkommen zurück
          </motion.h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-lg bg-red-50 p-4"
            >
              <div className="text-sm text-red-700">{error}</div>
            </motion.div>
          )}

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#023770] focus:border-transparent transition-all duration-200"
                placeholder="email@imn-aviation.de"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#023770] focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#023770] hover:bg-[#034694] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#023770] disabled:opacity-50 transition-all duration-200"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                'Anmelden'
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
} 