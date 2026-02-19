import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Building2,
    Mail,
    Phone,
    ExternalLink,
    Edit3,
    Trash2,
    MoreHorizontal,
} from 'lucide-react';
import { Card, Button, Input, Badge, Dialog, Textarea, Select, EmptyState } from '@/components/ui';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { Client, ClientStatus } from '@/types';

const STATUS_OPTIONS: { value: ClientStatus; label: string; variant: 'success' | 'warning' | 'destructive' }[] = [
    { value: 'active', label: 'Ativo', variant: 'success' },
    { value: 'negotiation', label: 'Negociação', variant: 'warning' },
    { value: 'churn', label: 'Churn', variant: 'destructive' },
];

export function Clients() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    // Form state
    const [form, setForm] = useState({
        company_name: '',
        decision_maker: '',
        email: '',
        phone: '',
        niche: '',
        status: 'active' as ClientStatus,
        contract_value: '',
        contract_duration: '',
        start_date: '',
        drive_link: '',
        notes: '',
    });

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const { data } = await supabase
                .from('clients')
                .select('*')
                .order('company_name', { ascending: true });
            if (data) setClients(data as Client[]);
        } catch (err) {
            console.error('Error loading clients:', err);
        } finally {
            setLoading(false);
        }
    };

    const saveClient = async () => {
        if (!form.company_name.trim()) return;

        const clientData = {
            company_name: form.company_name,
            decision_maker: form.decision_maker,
            email: form.email || null,
            phone: form.phone || null,
            niche: form.niche,
            status: form.status,
            contract_value: parseFloat(form.contract_value) || 0,
            contract_duration: parseInt(form.contract_duration) || 0,
            start_date: form.start_date || new Date().toISOString().split('T')[0],
            ltv: (parseFloat(form.contract_value) || 0) * (parseInt(form.contract_duration) || 1),
            drive_link: form.drive_link || null,
            notes: form.notes || null,
        };

        if (editingClient) {
            const { error } = await supabase
                .from('clients')
                .update(clientData)
                .eq('id', editingClient.id);
            if (!error) { closeForm(); loadClients(); }
        } else {
            const { error } = await supabase.from('clients').insert(clientData);
            if (!error) { closeForm(); loadClients(); }
        }
    };

    const deleteClient = async (id: string) => {
        if (!confirm('Tem certeza? Isso removerá o cliente e todos os dados associados.')) return;
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (!error) loadClients();
    };

    const startEdit = (client: Client) => {
        setEditingClient(client);
        setForm({
            company_name: client.company_name,
            decision_maker: client.decision_maker,
            email: client.email || '',
            phone: client.phone || '',
            niche: client.niche,
            status: client.status,
            contract_value: String(client.contract_value || ''),
            contract_duration: String(client.contract_duration || ''),
            start_date: client.start_date,
            drive_link: client.drive_link || '',
            notes: client.notes || '',
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingClient(null);
        setForm({
            company_name: '', decision_maker: '', email: '', phone: '',
            niche: '', status: 'active', contract_value: '', contract_duration: '',
            start_date: '', drive_link: '', notes: '',
        });
    };

    const filteredClients = clients.filter((c) => {
        const matchesSearch =
            c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.decision_maker.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !filterStatus || c.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Stats
    const activeCount = clients.filter((c) => c.status === 'active').length;
    const totalMRR = clients.filter((c) => c.status === 'active').reduce((s, c) => s + (c.contract_value || 0), 0);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {activeCount} ativos · MRR {formatCurrency(totalMRR)}
                    </p>
                </div>
                <Button onClick={() => { closeForm(); setShowForm(true); }}>
                    <Plus className="h-4 w-4" />
                    Novo Cliente
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                </div>
                <Select
                    id="filter-status"
                    options={[
                        { value: '', label: 'Todos' },
                        ...STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label })),
                    ]}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="sm:w-40"
                />
            </div>

            {/* Client Cards */}
            {filteredClients.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    title="Nenhum cliente encontrado"
                    description={searchQuery ? 'Tente buscar com outros termos' : 'Adicione seu primeiro cliente para começar'}
                    action={
                        !searchQuery && (
                            <Button variant="outline" onClick={() => { closeForm(); setShowForm(true); }}>
                                <Plus className="h-4 w-4" /> Adicionar Cliente
                            </Button>
                        )
                    }
                />
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredClients.map((client) => (
                        <Card key={client.id} glass hover className="group">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-sm font-bold text-white">
                                        {client.company_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground">{client.company_name}</h3>
                                        <p className="text-xs text-muted-foreground">{client.decision_maker}</p>
                                    </div>
                                </div>
                                <Badge variant={STATUS_OPTIONS.find((s) => s.value === client.status)?.variant || 'default'}>
                                    {STATUS_OPTIONS.find((s) => s.value === client.status)?.label}
                                </Badge>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase">Contrato</p>
                                    <p className="text-sm font-semibold text-foreground">
                                        {formatCurrency(client.contract_value || 0)}/mês
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase">Nicho</p>
                                    <p className="text-sm font-medium text-foreground">{client.niche}</p>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                                {client.email && (
                                    <a href={`mailto:${client.email}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                                        <Mail className="h-3.5 w-3.5" />
                                    </a>
                                )}
                                {client.phone && (
                                    <a href={`tel:${client.phone}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                                        <Phone className="h-3.5 w-3.5" />
                                    </a>
                                )}
                                {client.drive_link && (
                                    <a href={client.drive_link} target="_blank" rel="noopener" className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                )}
                                <div className="flex-1" />
                                <button
                                    onClick={() => startEdit(client)}
                                    className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                                >
                                    <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => deleteClient(client.id)}
                                    className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog
                open={showForm}
                onClose={closeForm}
                title={editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                maxWidth="max-w-xl"
            >
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            id="client-company"
                            label="Empresa"
                            placeholder="Nome da empresa"
                            value={form.company_name}
                            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                            required
                        />
                        <Input
                            id="client-contact"
                            label="Decisor"
                            placeholder="Nome do contato"
                            value={form.decision_maker}
                            onChange={(e) => setForm({ ...form, decision_maker: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            id="client-email"
                            label="E-mail"
                            type="email"
                            placeholder="email@empresa.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                        <Input
                            id="client-phone"
                            label="Telefone"
                            placeholder="(11) 99999-9999"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            id="client-niche"
                            label="Nicho"
                            placeholder="Ex: E-commerce, SaaS"
                            value={form.niche}
                            onChange={(e) => setForm({ ...form, niche: e.target.value })}
                        />
                        <Select
                            id="client-status"
                            label="Status"
                            options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <Input
                            id="client-value"
                            label="Valor/mês (R$)"
                            type="number"
                            placeholder="5000"
                            value={form.contract_value}
                            onChange={(e) => setForm({ ...form, contract_value: e.target.value })}
                        />
                        <Input
                            id="client-duration"
                            label="Duração (meses)"
                            type="number"
                            placeholder="12"
                            value={form.contract_duration}
                            onChange={(e) => setForm({ ...form, contract_duration: e.target.value })}
                        />
                        <Input
                            id="client-start"
                            label="Início"
                            type="date"
                            value={form.start_date}
                            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                        />
                    </div>
                    <Input
                        id="client-drive"
                        label="Link do Drive"
                        placeholder="https://drive.google.com/..."
                        value={form.drive_link}
                        onChange={(e) => setForm({ ...form, drive_link: e.target.value })}
                    />
                    <Textarea
                        id="client-notes"
                        label="Observações"
                        placeholder="Notas sobre o cliente..."
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" onClick={closeForm}>Cancelar</Button>
                    <Button onClick={saveClient} disabled={!form.company_name.trim()}>
                        {editingClient ? 'Salvar' : 'Criar Cliente'}
                    </Button>
                </div>
            </Dialog>
        </div>
    );
}
