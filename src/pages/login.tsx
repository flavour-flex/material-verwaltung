import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (user) {
      const redirectPath = isAdmin ? '/dashboard' : '/bestellungen/neu';
      router.push(redirectPath);
    }
  }, [user, isAdmin, router]);

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

      toast.success('Erfolgreich angemeldet');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Anmeldung fehlgeschlagen');
      toast.error('Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#023770] via-[#034694] to-[#0355b3]">
      {/* Animierter Hintergrund */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="absolute inset-0 opacity-50">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full mix-blend-multiply filter blur-xl"
              animate={{
                x: ['0%', '100%', '0%'],
                y: ['0%', '100%', '0%'],
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${200 + Math.random() * 200}px`,
                height: `${200 + Math.random() * 200}px`,
                backgroundColor: `rgba(255, 255, 255, 0.1)`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-8 space-y-8">
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
        </motion.div>
      </div>
    </div>
  );
} 