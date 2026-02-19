import { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    User,
    Palette,
    Database,
    Key,
    Save,
    CheckCircle2,
    LayoutGrid,
    FileText,
    HardDrive,
    Facebook
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge, Tabs } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { MetaService } from '@/lib/meta';
import { GoogleDriveService } from '@/lib/google-drive';
import { NotionService } from '@/lib/notion';
import { ClickUpService } from '@/lib/clickup';

export function Settings() {
    const { profile, role } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [theme, setTheme] = useState(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    // Integration States
    const [metaToken, setMetaToken] = useState('');
    const [metaAccountId, setMetaAccountId] = useState('');
    const [driveClientId, setDriveClientId] = useState('');
    const [driveSecret, setDriveSecret] = useState(''); // simplified for demo
    const [notionToken, setNotionToken] = useState('');
    const [clickupToken, setClickupToken] = useState('');

    const [saving, setSaving] = useState<string | null>(null);

    // Initial Load (Mock load from localStorage or DB would be here)
    useEffect(() => {
        // In a real app, we'd fetch these from the 'integrations' table via the Services
        // MetaService.getCredentials().then(...)
    }, []);

    const toggleTheme = (newTheme: string) => {
        setTheme(newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', newTheme);
    };

    const handleSave = async (provider: string, saveFn: () => Promise<any>) => {
        setSaving(provider);
        try {
            await saveFn();
            // Show success toast (mocked via console for now)
            console.log(`${provider} saved!`);
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gerencie seu perfil, preferências e integrações
                    </p>
                </div>
                <Tabs
                    tabs={[
                        { id: 'general', label: 'Geral' },
                        { id: 'integrations', label: 'Integrações' }
                    ]}
                    active={activeTab}
                    onChange={setActiveTab}
                />
            </div>

            {activeTab === 'general' && (
                <div className="space-y-6">
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
                                    <Badge variant="outline">v1.1.0 Integrations</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Backend</span>
                                    <Badge variant="outline">Supabase</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'integrations' && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Meta Ads - Only Admin */}
                    {role === 'admin' && (
                        <Card glass>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Facebook className="h-4 w-4 text-blue-500" />
                                    Meta Ads
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-xs text-muted-foreground">
                                    Conecte para ver métricas de campanhas no Dashboard.
                                </p>
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Ad Account ID"
                                        value={metaAccountId}
                                        onChange={e => setMetaAccountId(e.target.value)}
                                        className="text-xs"
                                    />
                                    <Input
                                        type="password"
                                        placeholder="Access Token"
                                        value={metaToken}
                                        onChange={e => setMetaToken(e.target.value)}
                                        className="text-xs"
                                    />
                                    <Button
                                        size="sm"
                                        className="w-full"
                                        disabled={saving === 'meta'}
                                        onClick={() => handleSave('meta', () => MetaService.saveCredentials(metaToken, metaAccountId))}
                                    >
                                        {saving === 'meta' ? 'Salvando...' : 'Salvar Conexão'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Google Drive */}
                    <Card glass>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HardDrive className="h-4 w-4 text-green-500" />
                                Google Drive
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-muted-foreground">
                                Acesse arquivos de clientes diretamente pelo portal.
                            </p>
                            <div className="space-y-2">
                                <Input
                                    placeholder="Client ID / API Key"
                                    value={driveClientId}
                                    onChange={e => setDriveClientId(e.target.value)}
                                    className="text-xs"
                                />
                                <Button
                                    size="sm"
                                    className="w-full"
                                    disabled={saving === 'drive'}
                                    onClick={() => handleSave('drive', () => GoogleDriveService.saveCredentials(driveClientId, '', ''))}
                                >
                                    {saving === 'drive' ? 'Salvando...' : 'Conectar Drive'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notion */}
                    <Card glass>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Notion
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-muted-foreground">
                                Sincronize Wikis e documentos da empresa.
                            </p>
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    placeholder="Integration Token (ntn_...)"
                                    value={notionToken}
                                    onChange={e => setNotionToken(e.target.value)}
                                    className="text-xs"
                                />
                                <Button
                                    size="sm"
                                    className="w-full"
                                    disabled={saving === 'notion'}
                                    onClick={() => handleSave('notion', () => NotionService.saveCredentials(notionToken))}
                                >
                                    {saving === 'notion' ? 'Salvando...' : 'Conectar Notion'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ClickUp */}
                    <Card glass>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LayoutGrid className="h-4 w-4 text-purple-500" />
                                ClickUp
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-muted-foreground">
                                Importe tarefas e status das listas do ClickUp.
                            </p>
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    placeholder="Personal Access Token (pk_...)"
                                    value={clickupToken}
                                    onChange={e => setClickupToken(e.target.value)}
                                    className="text-xs"
                                />
                                <Button
                                    size="sm"
                                    className="w-full"
                                    disabled={saving === 'clickup'}
                                    onClick={() => handleSave('clickup', () => ClickUpService.saveCredentials(clickupToken))}
                                >
                                    {saving === 'clickup' ? 'Salvando...' : 'Conectar ClickUp'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
