import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    BookOpen,
    Folder,
    FolderOpen,
    Archive,
    Layers,
    Edit3,
    Trash2,
    FileText,
    Eye,
    X,
    Settings,
    ExternalLink
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge, Dialog, Textarea, Select, EmptyState, Tabs } from '@/components/ui';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { SOP, ParaCategory } from '@/types';

const PARA_TABS = [
    { id: 'projects' as ParaCategory, label: 'Projetos', icon: FolderOpen },
    { id: 'areas' as ParaCategory, label: 'Áreas', icon: Layers },
    { id: 'resources' as ParaCategory, label: 'Recursos', icon: Folder },
    { id: 'archive' as ParaCategory, label: 'Arquivo', icon: Archive },
    { id: 'wiki' as ParaCategory, label: 'Wiki (Notion)', icon: BookOpen },
];

export function Processes() {
    const { user } = useAuth();
    const [sops, setSops] = useState<SOP[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ParaCategory>('projects');
    const [searchQuery, setSearchQuery] = useState('');
    const [showEditor, setShowEditor] = useState(false);
    const [viewingSop, setViewingSop] = useState<SOP | null>(null);
    const [editingSop, setEditingSop] = useState<SOP | null>(null);

    // Wiki State
    const [wikiUrl, setWikiUrl] = useState<string | null>(null);
    const [showWikiConfig, setShowWikiConfig] = useState(false);
    const [newWikiUrl, setNewWikiUrl] = useState('');

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formContent, setFormContent] = useState('');
    const [formCategory, setFormCategory] = useState<ParaCategory>('projects');
    const [formTags, setFormTags] = useState('');

    useEffect(() => {
        loadSops();
        loadWikiConfig();
    }, []);

    const loadSops = async () => {
        try {
            const { data, error } = await supabase
                .from('sops')
                .select('*')
                .order('updated_at', { ascending: false });

            if (data) setSops(data as unknown as SOP[]);
        } catch (err) {
            console.error('Error loading SOPs:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadWikiConfig = async () => {
        const { data } = await supabase.from('integrations').select('*').eq('provider', 'notion').single();
        if (data?.credentials?.url) {
            setWikiUrl(data.credentials.url);
        }
    };

    const saveWikiConfig = async () => {
        if (!newWikiUrl) return;
        const { error } = await supabase.from('integrations').upsert({
            provider: 'notion',
            credentials: { url: newWikiUrl },
            status: 'active'
        }, { onConflict: 'provider' });

        if (!error) {
            setWikiUrl(newWikiUrl);
            setShowWikiConfig(false);
        }
    };

    const saveSop = async () => {
        if (!formTitle.trim() || !formContent.trim()) return;

        const sopData = {
            title: formTitle,
            content: formContent,
            category: formCategory,
            tags: formTags.split(',').map((t) => t.trim()).filter(Boolean),
            created_by: user?.id || '',
        };

        if (editingSop) {
            const { error } = await supabase
                .from('sops')
                .update({ ...sopData, updated_at: new Date().toISOString() })
                .eq('id', editingSop.id);
            if (!error) {
                setShowEditor(false);
                setEditingSop(null);
                resetForm();
                loadSops();
            }
        } else {
            const { error } = await supabase.from('sops').insert(sopData);
            if (!error) {
                setShowEditor(false);
                resetForm();
                loadSops();
            }
        }
    };

    const deleteSop = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este manual?')) return;
        const { error } = await supabase.from('sops').delete().eq('id', id);
        if (!error) loadSops();
    };

    const startEdit = (sop: SOP) => {
        setEditingSop(sop);
        setFormTitle(sop.title);
        setFormContent(sop.content);
        setFormCategory(sop.category);
        setFormTags(sop.tags?.join(', ') || '');
        setShowEditor(true);
    };

    const resetForm = () => {
        setFormTitle('');
        setFormContent('');
        setFormCategory('projects');
        setFormTags('');
    };

    // Filter SOPs
    const filteredSops = sops.filter((sop) => {
        const matchesTab = sop.category === activeTab;
        const matchesSearch =
            !searchQuery ||
            sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sop.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sop.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesTab && matchesSearch;
    });

    const tabsWithCount = PARA_TABS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        count: tab.id === 'wiki' ? (wikiUrl ? 1 : 0) : sops.filter((s) => s.category === tab.id).length,
    }));

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Biblioteca de Processos</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Cérebro da agência — Método PARA + Wiki
                    </p>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'wiki' && (
                        <Button variant="outline" onClick={() => setShowWikiConfig(true)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar Notion
                        </Button>
                    )}
                    <Button onClick={() => { resetForm(); setEditingSop(null); setShowEditor(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Manual
                    </Button>
                </div>
            </div>

            {/* PARA Tabs */}
            <Tabs
                tabs={tabsWithCount}
                active={activeTab}
                onChange={(id) => setActiveTab(id as ParaCategory)}
            />

            {/* Search (only for SOPs) */}
            {activeTab !== 'wiki' && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar em todos os manuais, SOPs e documentos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                </div>
            )}

            {/* Category Description */}
            <div className="rounded-xl bg-accent/30 p-4">
                <div className="flex items-center gap-2 mb-1">
                    {(() => {
                        const Icon = PARA_TABS.find((t) => t.id === activeTab)?.icon || Folder;
                        return <Icon className="h-4 w-4 text-primary" />;
                    })()}
                    <span className="text-sm font-semibold text-foreground">
                        {PARA_TABS.find((t) => t.id === activeTab)?.label}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground">
                    {activeTab === 'projects' && 'Processos com objetivo e prazo definidos. Ex: "Onboarding novo cliente", "Lançamento campanha X".'}
                    {activeTab === 'areas' && 'Responsabilidades contínuas sem prazo final. Ex: "Gestão de tráfego", "Atendimento ao cliente".'}
                    {activeTab === 'resources' && 'Materiais de referência e templates reutilizáveis. Ex: "Templates de copy", "Checklist de auditoria".'}
                    {activeTab === 'archive' && 'Processos inativos mantidos para consulta futura.'}
                    {activeTab === 'wiki' && 'Central de conhecimento da empresa (Notion).'}
                </p>
            </div>

            {/* Main Content */}
            {activeTab === 'wiki' ? (
                // Wiki View
                <div className="h-[600px] w-full rounded-xl border border-border/50 bg-card overflow-hidden">
                    {wikiUrl ? (
                        <iframe
                            src={wikiUrl}
                            className="w-full h-full border-0"
                            title="Notion Wiki"
                        />
                    ) : (
                        <EmptyState
                            icon={BookOpen}
                            title="Wiki não configurada"
                            description="Conecte seu Notion para exibir a documentação da empresa aqui."
                            action={
                                <Button onClick={() => setShowWikiConfig(true)}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Configurar URL do Notion
                                </Button>
                            }
                        />
                    )}
                </div>
            ) : (
                // SOP Grid
                <>
                    {filteredSops.length === 0 ? (
                        <EmptyState
                            icon={BookOpen}
                            title="Nenhum manual encontrado"
                            description={
                                searchQuery
                                    ? 'Tente buscar com outros termos'
                                    : `Crie o primeiro manual na categoria "${PARA_TABS.find((t) => t.id === activeTab)?.label}"`
                            }
                            action={
                                !searchQuery && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            resetForm();
                                            setFormCategory(activeTab);
                                            setEditingSop(null);
                                            setShowEditor(true);
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Criar Manual
                                    </Button>
                                )
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredSops.map((sop) => (
                                <Card
                                    key={sop.id}
                                    glass
                                    hover
                                    className="group cursor-pointer"
                                    onClick={() => setViewingSop(sop)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="rounded-lg bg-primary/10 p-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-foreground truncate">
                                                    {sop.title}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {sop.content.replace(/[#*_`]/g, '').slice(0, 100)}...
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                                        {sop.tags?.slice(0, 3).map((tag) => (
                                            <Badge key={tag} variant="outline" className="text-[10px]">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Date(sop.updated_at).toLocaleDateString('pt-BR')}
                                        </span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startEdit(sop); }}
                                                className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                            >
                                                <Edit3 className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteSop(sop.id); }}
                                                className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Wiki Config Dialog */}
            <Dialog
                open={showWikiConfig}
                onClose={() => setShowWikiConfig(false)}
                title="Configurar Wiki (Notion)"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Insira a URL pública da sua página do Notion (Publique como site).
                    </p>
                    <Input
                        placeholder="https://notion.site/..."
                        value={newWikiUrl}
                        onChange={e => setNewWikiUrl(e.target.value)}
                    />
                    <Button className="w-full" onClick={saveWikiConfig}>Salvar Integração</Button>
                </div>
            </Dialog>

            {/* View SOP Dialog */}
            <Dialog
                open={!!viewingSop}
                onClose={() => setViewingSop(null)}
                title={viewingSop?.title || ''}
                maxWidth="max-w-2xl"
            >
                {viewingSop && (
                    <div>
                        <div className="flex gap-2 mb-4">
                            <Badge>
                                {PARA_TABS.find((t) => t.id === viewingSop.category)?.label}
                            </Badge>
                            {viewingSop.tags?.map((tag) => (
                                <Badge key={tag} variant="outline">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                        <div className="prose prose-sm prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                                {viewingSop.content}
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/50">
                            <span className="text-xs text-muted-foreground">
                                Atualizado em {new Date(viewingSop.updated_at).toLocaleDateString('pt-BR')}
                            </span>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => { setViewingSop(null); startEdit(viewingSop); }}>
                                    <Edit3 className="h-4 w-4" />
                                    Editar
                                </Button>
                                <Button variant="ghost" onClick={() => setViewingSop(null)}>
                                    Fechar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Dialog>

            {/* Create/Edit SOP Dialog */}
            <Dialog
                open={showEditor}
                onClose={() => { setShowEditor(false); setEditingSop(null); resetForm(); }}
                title={editingSop ? 'Editar Manual' : 'Novo Manual'}
                maxWidth="max-w-2xl"
            >
                <div className="space-y-4">
                    <Input
                        id="sop-title"
                        label="Título"
                        placeholder="Nome do Manual ou SOP..."
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        required
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            id="sop-category"
                            label="Categoria PARA"
                            options={PARA_TABS.filter(t => t.id !== 'wiki').map((t) => ({ value: t.id, label: t.label }))}
                            value={formCategory}
                            onChange={(e) => setFormCategory(e.target.value as ParaCategory)}
                        />
                        <Input
                            id="sop-tags"
                            label="Tags (separadas por vírgula)"
                            placeholder="tráfego, meta, copy"
                            value={formTags}
                            onChange={(e) => setFormTags(e.target.value)}
                        />
                    </div>
                    <Textarea
                        id="sop-content"
                        label="Conteúdo"
                        placeholder="Escreva o conteúdo do manual aqui. Você pode usar formatação Markdown..."
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        className="min-h-[250px]"
                        required
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => { setShowEditor(false); setEditingSop(null); resetForm(); }}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={saveSop} disabled={!formTitle.trim() || !formContent.trim()}>
                            {editingSop ? 'Salvar Alterações' : 'Criar Manual'}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
