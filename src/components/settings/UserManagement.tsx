import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { z } from 'zod';

// E-Mail-Validierungsschema - jetzt für alle gültigen E-Mail-Adressen
const emailSchema = z
  .string()
  .email('Ungültige E-Mail-Adresse')
  .min(5, 'E-Mail-Adresse ist zu kurz')
  .max(254, 'E-Mail-Adresse ist zu lang');

interface User {
  id: string;
  email: string;
  role: 'admin' | 'standortverantwortlich';
  created_at: string;
}

export default function UserManagement() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'standortverantwortlich'>('standortverantwortlich');
  const [emailError, setEmailError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // E-Mail-Validierung beim Ändern
  const validateEmail = (email: string) => {
    try {
      emailSchema.parse(email);
      setEmailError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setEmailError(error.errors[0].message);
      }
      return false;
    }
  };

  // Benutzer abrufen
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Neuen Benutzer einladen
  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      try {
        // E-Mail validieren
        emailSchema.parse(email);

        // 1. Temporäres Passwort generieren
        const tempPassword = Math.random().toString(36).slice(-12);

        // 2. Benutzer mit temporärem Passwort erstellen
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.toLowerCase().trim(), // E-Mail normalisieren
          password: tempPassword,
          options: {
            data: { role },
            emailRedirectTo: `${window.location.origin}/auth/set-password`
          }
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            throw new Error('Diese E-Mail-Adresse ist bereits registriert');
          }
          throw authError;
        }

        if (!authData.user) throw new Error('Keine Benutzer-ID erhalten');

        // Warten, bis der Benutzer in der Auth-Tabelle erstellt wurde
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 3. Prüfen ob der Benutzer bereits in der users-Tabelle existiert
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', email.toLowerCase().trim())
          .single();

        if (!existingUser) {
          // 4. Benutzer in users-Tabelle eintragen
          const { error: userError } = await supabase
            .from('users')
            .insert([{ 
              id: authData.user.id,
              email: email.toLowerCase().trim(), 
              role,
              temp_password: true
            }]);

          if (userError) throw userError;
        } else {
          // 5. Existierenden Benutzer aktualisieren
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              role,
              temp_password: true
            })
            .eq('id', existingUser.id);

          if (updateError) throw updateError;
        }

        return authData;
      } catch (error: any) {
        // Wenn etwas schief geht, versuchen wir den Auth-Benutzer zu löschen
        if (!error.message?.includes('already registered')) {
          const user = await supabase.auth.getUser();
          if (user.data.user) {
            await supabase.auth.admin.deleteUser(user.data.user.id);
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Benutzer erfolgreich eingeladen');
      setEmail('');
      queryClient.invalidateQueries(['users']);
    },
    onError: (error: any) => {
      console.error('Fehler beim Einladen:', error);
      toast.error(error.message || 'Fehler beim Einladen des Benutzers');
    }
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !validateEmail(email)) return;

    inviteUserMutation.mutate({ email, role });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Benutzerverwaltung</h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Hier können Sie neue Benutzer einladen und bestehende Benutzer verwalten.
        </p>
      </div>

      <form onSubmit={handleInvite} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-Mail-Adresse
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateEmail(e.target.value);
              }}
              className={`mt-1 block w-full rounded-md shadow-sm focus:border-[#023770] focus:ring-[#023770] sm:text-sm ${
                emailError ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="neue.person@imn-aviation.de"
            />
            {emailError && (
              <p className="mt-1 text-sm text-red-600">{emailError}</p>
            )}
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Rolle
            </label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'standortverantwortlich')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#023770] focus:ring-[#023770] sm:text-sm"
            >
              <option value="standortverantwortlich">Standortverantwortlicher</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={inviteUserMutation.isLoading || !email}
            className="inline-flex justify-center rounded-md border border-transparent bg-[#023770] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[#034694] focus:outline-none focus:ring-2 focus:ring-[#023770] focus:ring-offset-2 disabled:opacity-50"
          >
            {inviteUserMutation.isLoading ? 'Wird eingeladen...' : 'Benutzer einladen'}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h4 className="text-base font-medium text-gray-900">Bestehende Benutzer</h4>
        <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  E-Mail
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Rolle
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Erstellt am
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users?.map((user) => (
                <tr key={user.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                    {user.email}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {user.role === 'admin' ? 'Administrator' : 'Standortverantwortlicher'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('de-DE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 