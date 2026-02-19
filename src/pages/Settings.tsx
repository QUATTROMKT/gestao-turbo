import { useState } from 'react';
import {
    Settings as SettingsIcon,
    User,
    Shield,
    Palette,
    Database,
    Key,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge, Select } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { MetaService } from '@/lib/meta';
import { useEffect } from 'react';

export function Settings() {
    const { profile, role } = useAuth();
    const [theme, setTheme] = useState(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    const toggleTheme = (newTheme: string) => {
        setTheme(newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', newTheme);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Gerencie seu perfil e preferências do sistema
                </p>
            </div>

            {/* Profile */}
            <Card glass>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Perfil
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary text-xl font-bold text-white">
                            {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">
                                {profile?.full_name || 'Usuário'}
                            </h3>
                            <p className="text-sm text-muted-foreground">{profile?.email}</p>
                            <Badge className="mt-1 capitalize">{role}</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Theme */}
            <Card glass>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-primary" />
                        Aparência
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <button
                            onClick={() => toggleTheme('dark')}
                            className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${theme === 'dark'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-border/80'
                                }`}
                        >
                            <div className="mx-auto mb-2 h-8 w-8 rounded-lg bg-gray-900 border border-gray-700" />
                            <span className="text-sm font-medium">Escuro</span>
                        </button>
                        <button
                            onClick={() => toggleTheme('light')}
                            className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${theme === 'light'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-border/80'
                                }`}
                        >
                            <div className="mx-auto mb-2 h-8 w-8 rounded-lg bg-white border border-gray-300" />
                            <span className="text-sm font-medium">Claro</span>
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* System Info */}
            <Card glass>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-primary" />
                        Sistema
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Versão</span>
                            <Badge variant="outline">v1.0.0 MVP</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Backend</span>
                            <Badge variant="outline">Supabase</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Metodologia</span>
                            <Badge variant="outline">EOS + PARA</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Integrations (future) */}
            <Card glass className="opacity-60">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-primary" />
                        Integrações
                        <Badge variant="outline" className="ml-2">Em breve</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Meta Ads, Google Ads, ClickUp, Notion e Google Drive serão integrados em futuras atualizações.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
