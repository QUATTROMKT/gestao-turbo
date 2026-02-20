import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Select } from '@/components/ui';
import { Users, Shield, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';

const ROLES: { value: UserRole; label: string }[] = [
    { value: 'admin', label: 'Admin (Sócio)' },
    { value: 'editor', label: 'Editor (Operação)' },
    { value: 'sales', label: 'Vendas (BDR)' },
    { value: 'viewer', label: 'Cliente (Viewer)' },
];

export function AdminUsers() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        setSaving(userId);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Erro ao atualizar cargo');
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Gestão de Equipe</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Gerencie os membros e seus níveis de acesso
                </p>
            </div>

            <Card glass>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Membros do Time
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {users.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 rounded-xl bg-accent/30 border border-border/50">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
                                        {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">{user.full_name || 'Sem nome'}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-48">
                                        <select
                                            className="w-full h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                            disabled={saving === user.id}
                                        >
                                            {ROLES.map(role => (
                                                <option key={role.value} value={role.value}>
                                                    {role.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {users.length === 0 && !loading && (
                            <p className="text-center text-muted-foreground py-8">
                                Nenhum usuário encontrado.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
                <div className="p-4 rounded-xl bg-accent/20 border border-border/30">
                    <strong className="text-foreground block mb-1">Admin (Sócio)</strong>
                    Acesso total: Financeiro, Configurações, Vendas e Operação.
                </div>
                <div className="p-4 rounded-xl bg-accent/20 border border-border/30">
                    <strong className="text-foreground block mb-1">Editor (Operação)</strong>
                    Acesso a Tarefas, Clientes e Arquivos. Sem ver Financeiro.
                </div>
                <div className="p-4 rounded-xl bg-accent/20 border border-border/30">
                    <strong className="text-foreground block mb-1">Vendas (BDR)</strong>
                    Acesso exclusivo ao Pipeline e Agenda. Sem ver Operação interna.
                </div>
            </div>
        </div>
    );
}
