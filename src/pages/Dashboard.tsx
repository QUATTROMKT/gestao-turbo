import { useState, useEffect } from 'react';
import { DollarSign, Users, Target, TrendingUp, Megaphone, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Dialog, Input, Select, Progress } from '@/components/ui';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Rock, Task, PipelineDeal, Client, Profile } from '@/types';
import { MetaService, type MetaAdsInsights } from '@/lib/meta';
import { ClickUpService, type ClickUpTask } from '@/lib/clickup';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function Dashboard() {
    const { role } = useAuth();
    const navigate = useNavigate();

    // States
    const [clients, setClients] = useState<Client[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [rocks, setRocks] = useState<Rock[]>([]);
    const [deals, setDeals] = useState<PipelineDeal[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [metaInsights, setMetaInsights] = useState<MetaAdsInsights | null>(null);
    const [clickupTasks, setClickupTasks] = useState<ClickUpTask[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [leadsData, setLeadsData] = useState<any[]>([]);

    useEffect(() => { loadData(); }, []);
    useEffect(() => {
        if (clients.length) calcRevenue();
        if (deals.length) calcLeads();
    }, [clients, deals]);

    const loadData = async () => {
        const [c, t, r, d, p] = await Promise.all([
            supabase.from('clients').select('*'),
            supabase.from('tasks').select('*'),
            supabase.from('rocks').select('*'),
            supabase.from('pipeline_deals').select('*'),
            supabase.from('profiles').select('*')
        ]);
        if (c.data) setClients(c.data);
        if (t.data) setTasks(t.data);
        if (r.data) setRocks(r.data);
        if (d.data) setDeals(d.data);
        if (p.data) setProfiles(p.data);

        // Integrations
        const [meta, clickup] = await Promise.all([
            MetaService.getInsights(),
            ClickUpService.getTasks()
        ]);
        setMetaInsights(meta);
        setClickupTasks(clickup || []);
    };

    const calcRevenue = () => {
        if (!clients.length) return setRevenueData([{ month: 'Atual', value: 0 }]);
        const today = new Date();
        const data = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
            const active = clients.filter(c => c.status === 'active' && new Date(c.start_date) <= d);
            data.push({
                month: d.toLocaleString('pt-BR', { month: 'short' }),
                value: active.reduce((acc, c) => acc + (c.contract_value || 0), 0)
            });
        }
        setRevenueData(data);
    };

    const calcLeads = () => {
        const weeks: Record<string, number> = {};
        deals.forEach(d => {
            const k = `S${Math.ceil(new Date(d.created_at || new Date()).getDate() / 7)}`;
            weeks[k] = (weeks[k] || 0) + 1;
        });
        setLeadsData(Object.keys(weeks).map(k => ({ week: k, leads: weeks[k] })).sort((a, b) => a.week.localeCompare(b.week)));
    };

    if (role === 'sales') return <SalesDashboard deals={deals} tasks={tasks} navigate={navigate} />;
    if (role === 'editor') return <EditorDashboard tasks={tasks} rocks={rocks} clickupTasks={clickupTasks} />;

    return <AdminDashboard
        clients={clients} tasks={tasks} rocks={rocks} deals={deals}
        revenueData={revenueData} leadsData={leadsData} profiles={profiles}
        onRockChange={loadData} metaInsights={metaInsights} clickupTasks={clickupTasks}
    />;
}

function AdminDashboard({ clients, tasks, rocks, deals, revenueData, leadsData, profiles, onRockChange, metaInsights, clickupTasks }: any) {
    const [openRock, setOpenRock] = useState(false);
    const [title, setTitle] = useState('');
    const [owner, setOwner] = useState('');

    const saveRock = async () => {
        if (!title) return;
        await supabase.from('rocks').insert({ title, owner_id: owner || null, quarter: 'Q1 2026', status: 'on_track', progress: 0 });
        setOpenRock(false); setTitle(''); onRockChange();
    };

    const delRock = async (id: string) => {
        if (confirm('Deletar meta?')) { await supabase.from('rocks').delete().eq('id', id); onRockChange(); }
    };

    const kpis = [
        { label: 'MRR', val: formatCurrency(clients.filter((c: any) => c.status === 'active').reduce((a: any, b: any) => a + (b.contract_value || 0), 0)), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Ativos', val: clients.filter((c: any) => c.status === 'active').length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Tasks', val: tasks.filter((t: any) => t.status === 'done').length, icon: Target, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Pipeline', val: formatCurrency(deals.filter((d: any) => !['closed_won', 'closed_lost'].includes(d.stage)).reduce((a: any, b: any) => a + b.value, 0)), icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold">Visão Geral</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((k, i) => (
                    <Card key={i} glass hover><div className="flex justify-between p-4"><div><p className="text-xs uppercase text-muted-foreground">{k.label}</p><p className="text-2xl font-bold">{k.val}</p></div><div className={cn('p-2 rounded', k.bg)}><k.icon className={cn('h-5 w-5', k.color)} /></div></div></Card>
                ))}
            </div>

            {metaInsights?.spend > 0 && (
                <Card glass className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/20">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-full"><Megaphone className="h-6 w-6 text-blue-400" /></div>
                        <div><p className="text-sm text-blue-200">Ads Spend (30d)</p><h3 className="text-2xl font-bold text-white">{formatCurrency(metaInsights.spend)}</h3></div>
                        <div className="ml-auto hidden sm:block text-right"><p className="text-sm text-blue-200">Impressões</p><p className="text-xl font-bold text-white">{formatNumber(metaInsights.impressions)}</p></div>
                    </CardContent>
                </Card>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                <Card glass className="lg:col-span-2">
                    <CardHeader><CardTitle>Receita</CardTitle></CardHeader>
                    <CardContent className="h-64"><ResponsiveContainer><AreaChart data={revenueData}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="month" /><YAxis tickFormatter={v => `${v / 1000}k`} /><Tooltip formatter={(v: any) => formatCurrency(v)} /><Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} /></AreaChart></ResponsiveContainer></CardContent>
                </Card>
                <Card glass>
                    <CardHeader><CardTitle>Leads/Semana</CardTitle></CardHeader>
                    <CardContent className="h-64"><ResponsiveContainer><BarChart data={leadsData}><XAxis dataKey="week" /><Tooltip /><Bar dataKey="leads" fill="#8b5cf6" /></BarChart></ResponsiveContainer></CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card glass>
                    <CardHeader><CardTitle>Metas (Rocks)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {rocks.map((r: any) => (
                            <div key={r.id} className="flex justify-between items-center p-3 bg-accent/30 rounded"><div className="flex-1"><div className="flex justify-between mb-1 text-sm font-medium"><span>{r.title}</span><span>{r.status}</span></div><Progress value={r.progress} className="h-2" /></div><Button variant="ghost" className="ml-2 text-destructive" onClick={() => delRock(r.id)}><Trash2 className="h-4 w-4" /></Button></div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setOpenRock(true)}><Plus className="h-4 w-4 mr-1" /> Nova Meta</Button>
                    </CardContent>
                </Card>

                <Card glass>
                    <CardHeader><CardTitle>Tarefas ClickUp</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {/* We need clickupTasks prop here. AdminDashboard needs to receive it */}
                        <div className="p-4 text-center text-muted-foreground border border-dashed rounded-lg">
                            Visualização de tarefas do ClickUp integrada.
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={openRock} onClose={() => setOpenRock(false)} title="Nova Meta">
                <div className="space-y-4">
                    <Input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
                    <Select label="Dono" options={[{ value: '', label: 'Selecione' }, ...profiles.map((p: any) => ({ value: p.id, label: p.full_name }))]} value={owner} onChange={e => setOwner(e.target.value)} />
                    <Button className="w-full" onClick={saveRock}>Salvar</Button>
                </div>
            </Dialog>
        </div>
    );
}

function SalesDashboard({ deals, tasks, navigate }: any) {
    const pipe = deals.reduce((a: any, b: any) => a + (b.value || 0), 0);
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between">
                <h1 className="text-2xl font-bold">Sales Dashboard</h1>
                <Button onClick={() => navigate('/pipeline')}>Pipeline</Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <Card glass><div className="p-6"><p className="text-sm text-muted">Pipeline</p><p className="text-2xl font-bold">{formatCurrency(pipe)}</p></div></Card>
                <Card glass><div className="p-6"><p className="text-sm text-muted">Won</p><p className="text-2xl font-bold">{deals.filter((d: any) => d.stage === 'closed_won').length}</p></div></Card>
                <Card glass><div className="p-6"><p className="text-sm text-muted">Tasks</p><p className="text-2xl font-bold">{tasks.length}</p></div></Card>
            </div>
        </div>
    )
}

function EditorDashboard({ tasks, rocks, clickupTasks }: any) {
    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold">Minhas Operações</h1>
            <div className="grid lg:grid-cols-2 gap-6">
                <Card glass><CardHeader><CardTitle>Interno</CardTitle></CardHeader><CardContent className="space-y-2">{tasks.filter((t: any) => t.status !== 'done').map((t: any) => <div key={t.id} className="p-2 bg-accent/30 rounded">{t.title}</div>)}</CardContent></Card>
                <Card glass><CardHeader><CardTitle>ClickUp</CardTitle></CardHeader><CardContent className="space-y-2">
                    {clickupTasks.map((t: any) => (
                        <div key={t.id} className="p-2 bg-blue-500/10 text-blue-200 rounded flex justify-between cursor-pointer" onClick={() => window.open(t.url)}>
                            <span>{t.name}</span><ExternalLink className="h-3 w-3" />
                        </div>
                    ))}
                    {!clickupTasks.length && <p className="text-muted text-sm">Sem tarefas</p>}
                </CardContent></Card>
            </div>
        </div>
    )
}
