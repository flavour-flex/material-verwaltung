import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { UserRole } from '@/types';

export default function UserManagementPage() {
  const { isAdmin } = useAuth();

  // Benutzer laden
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      const { data: userRoles, error: rolesError } = await supabase
        .from('users')
        .select('*');
      if (rolesError) throw rolesError;

      // Kombiniere Auth-User mit Rollen
      return authUsers.users.map(user => ({
        ...user,
        role: userRoles.find(r => r.id === user.id)?.role || 'user'
      }));
    },
    enabled: isAdmin,
  });

  // Rolle aktualisieren
  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: UserRole }) => {
      const { error } = await supabase
        .from('users')
        .upsert({ id: userId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Rolle aktualisiert');
    },
  });

  // Benutzer einladen
  const inviteUser = useMutation({
    mutationFn: async ({ email, role }: { email: string, role: UserRole }) => {
      // Einladung senden
      const { data, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email);
      if (inviteError) throw inviteError;

      // Rolle setzen
      if (data.user) {
        const { error: roleError } = await supabase
          .from('users')
          .insert({ id: data.user.id, role });
        
        if (roleError) throw roleError;
      }
    },
    onSuccess: () => {
      toast.success('Benutzer eingeladen');
    },
  });

  return (
    <Layout>
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Benutzerverwaltung
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => {/* Öffne Einladungs-Modal */}}
            className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
          >
            Benutzer einladen
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                E-Mail
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Name
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Rolle
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Aktionen</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users?.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {user.user_metadata?.name || '-'}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <select
                    value={user.role}
                    onChange={(e) => updateRole.mutate({ 
                      userId: user.id, 
                      role: e.target.value as UserRole 
                    })}
                    className="rounded-md border-0 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  >
                    <option value="user">Benutzer</option>
                    <option value="standortleiter">Standortleiter</option>
                    <option value="hauptlager">Hauptlager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                    user.confirmed_at 
                      ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' 
                      : 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
                  }`}>
                    {user.confirmed_at ? 'Aktiv' : 'Ausstehend'}
                  </span>
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    onClick={() => {/* Öffne Bearbeiten-Modal */}}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Bearbeiten
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
} 