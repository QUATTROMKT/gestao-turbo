import { useState, useEffect } from 'react';
import {
    DollarSign,
    Users,
    Target,
    TrendingUp,
    TrendingDown,
    Activity,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress } from '@/components/ui';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { Rock, Task, PipelineDeal, Client } from '@/types';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';

// Mock data for initial rendering (will be replaced by Supabase data)
const mockRevenueData = [
    { month: 'Set', value: 12000 },
    { month: 'Out', value: 15000 },
    { month: 'Nov', value: 14000 },
    { month: 'Dez', value: 18000 },
    { month: 'Jan', value: 22000 },
    { month: 'Fev', value: 25000 },
];

const mockLeadsData = [
    { week: 'S1', leads: 12 },
    { week: 'S2', leads: 18 },
    { week: 'S3', leads: 15 },
    { week: 'S4', leads: 22 },
];

export function Dashboard() {
    const [clients, setClients] = useState<Client[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [rocks, setRocks] = useState<Rock[]>([]);
    const [deals, setDeals] = useState<PipelineDeal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [clientsRes, tasksRes, rocksRes, dealsRes] = await Promise.all([
                supabase.from('clients').select('*'),
                supabase.from('tasks').select('*'),
                supabase.from('rocks').select('*'),
                supabase.from('pipeline_deals').select('*'),
            ]);

            if (clientsRes.data) setClients(clientsRes.data as Client[]);
            if (tasksRes.data) setTasks(tasksRes.data as Task[]);
            if (rocksRes.data) setRocks(rocksRes.data as Rock[]);
            if (dealsRes.data) setDeals(dealsRes.data as PipelineDeal[]);
        } catch (err) {
            console.error('Error loading dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Compute KPIs
    const activeClients = clients.filter((c) => c.status === 'active').length;
    const mrr = clients
        .filter((c) => c.status === 'active')
        .reduce((sum, c) => sum + (c.contract_value || 0), 0);
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const totalTasks = tasks.length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const pipelineValue = deals
        .filter((d) => !['closed_won', 'closed_lost'].includes(d.stage))
        .reduce((sum, d) => sum + d.value, 0);

    const kpiCards = [
        {
            title: 'MRR (Receita Mensal)',
            value: formatCurrency(mrr),
            change: 12.5,
            trend: 'up' as const,
            icon: DollarSign,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
        },
        {
            title: 'Clientes Ativos',
            value: formatNumber(activeClients),
            change: 0,
            trend: 'neutral' as const,
            icon: Users,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
        },
        {
            title: 'Tasks Concluídas',
            value: `${completedTasks}/${totalTasks}`,
            change: taskCompletionRate,
            trend: taskCompletionRate >= 70 ? 'up' as const : 'down' as const,
            icon: Target,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
        },
        {
            title: 'Pipeline de Vendas',
            value: formatCurrency(pipelineValue),
            change: 8.3,
            trend: 'up' as const,
            icon: TrendingUp,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
        },
    ];

    // Pipeline stages count
    const pipelineStages = [
        { stage: 'Lead', count: deals.filter((d) => d.stage === 'lead').length, color: 'bg-blue-500' },
        { stage: 'Proposta', count: deals.filter((d) => d.stage === 'proposal').length, color: 'bg-purple-500' },
        { stage: 'Negociação', count: deals.filter((d) => d.stage === 'negotiation').length, color: 'bg-amber-500' },
        { stage: 'Fechado', count: deals.filter((d) => d.stage === 'closed_won').length, color: 'bg-emerald-500' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Visão 360° da sua agência — Scorecard EOS
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map((kpi) => (
                    <Card key={kpi.title} glass hover className="group">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {kpi.title}
                                </p>
                                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                                {kpi.change !== 0 && (
                                    <div className="flex items-center gap-1">
                                        {kpi.trend === 'up' ? (
                                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                                        ) : kpi.trend === 'down' ? (
                                            <TrendingDown className="h-3 w-3 text-destructive" />
                                        ) : null}
                                        <span
                                            className={cn(
                                                'text-xs font-medium',
                                                kpi.trend === 'up' ? 'text-emerald-500' : 'text-destructive'
                                            )}
                                        >
                                            {kpi.change > 0 ? '+' : ''}
                                            {kpi.change.toFixed(1)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className={cn('rounded-xl p-2.5', kpi.bgColor)}>
                                <kpi.icon className={cn('h-5 w-5', kpi.color)} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Revenue Chart */}
                <Card glass className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Faturamento Mensal</CardTitle>
                        <Badge variant="success">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +12.5%
                        </Badge>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockRevenueData}>
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(216, 34%, 17%)" />
                                <XAxis
                                    dataKey="month"
                                    stroke="hsl(215, 16%, 47%)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="hsl(215, 16%, 47%)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(222, 47%, 11%)',
                                        border: '1px solid hsl(216, 34%, 17%)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                    }}
                                    formatter={(value: number | undefined) => [formatCurrency(value ?? 0), 'Receita']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="hsl(262, 83%, 58%)"
                                    strokeWidth={2}
                                    fill="url(#revenueGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Leads Chart */}
                <Card glass>
                    <CardHeader>
                        <CardTitle>Leads por Semana</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockLeadsData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(216, 34%, 17%)" />
                                <XAxis
                                    dataKey="week"
                                    stroke="hsl(215, 16%, 47%)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="hsl(215, 16%, 47%)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(222, 47%, 11%)',
                                        border: '1px solid hsl(216, 34%, 17%)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                    }}
                                />
                                <Bar
                                    dataKey="leads"
                                    fill="hsl(262, 83%, 58%)"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Rocks + Pipeline Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Rocks (Quarterly Goals) */}
                <Card glass>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            Rocks — Metas do Trimestre
                        </CardTitle>
                        <Badge variant="outline">Q1 2026</Badge>
                    </CardHeader>
                    <CardContent>
                        {rocks.length === 0 ? (
                            <div className="space-y-4">
                                {/* Placeholder rocks */}
                                {[
                                    { title: 'Fechar 3 novos clientes', progress: 66, status: 'on_track' },
                                    { title: 'Implementar sistema de gestão', progress: 40, status: 'on_track' },
                                    { title: 'Lançar portal do cliente', progress: 10, status: 'off_track' },
                                ].map((rock, i) => (
                                    <div key={i} className="rounded-xl bg-accent/30 p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-foreground">{rock.title}</span>
                                            <Badge
                                                variant={rock.status === 'on_track' ? 'success' : 'warning'}
                                            >
                                                {rock.status === 'on_track' ? 'No Track' : 'Off Track'}
                                            </Badge>
                                        </div>
                                        <Progress
                                            value={rock.progress}
                                            variant={rock.status === 'on_track' ? 'primary' : 'warning'}
                                            showLabel
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {rocks.map((rock) => (
                                    <div key={rock.id} className="rounded-xl bg-accent/30 p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-foreground">
                                                {rock.title}
                                            </span>
                                            <Badge
                                                variant={
                                                    rock.status === 'on_track'
                                                        ? 'success'
                                                        : rock.status === 'done'
                                                            ? 'default'
                                                            : 'warning'
                                                }
                                            >
                                                {rock.status === 'on_track'
                                                    ? 'No Track'
                                                    : rock.status === 'done'
                                                        ? 'Concluído'
                                                        : 'Off Track'}
                                            </Badge>
                                        </div>
                                        <Progress
                                            value={rock.progress}
                                            variant={rock.status === 'on_track' ? 'primary' : 'warning'}
                                            showLabel
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pipeline */}
                <Card glass>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            Pipeline de Vendas
                        </CardTitle>
                        <span className="text-sm font-semibold text-foreground">
                            {formatCurrency(pipelineValue)}
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {pipelineStages.map((stage) => (
                                <div key={stage.stage} className="flex items-center gap-4">
                                    <div className={cn('h-2 w-2 rounded-full', stage.color)} />
                                    <span className="text-sm text-foreground flex-1">{stage.stage}</span>
                                    <span className="text-sm font-semibold text-foreground">
                                        {stage.count}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Recent activity */}
                        <div className="mt-6 border-t border-border/50 pt-4">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Atividade Recente
                            </h4>
                            <div className="space-y-3">
                                {tasks.length === 0 ? (
                                    <div className="space-y-3">
                                        {[
                                            { icon: CheckCircle2, text: 'Task "Editar vídeo cliente X" concluída', color: 'text-emerald-500' },
                                            { icon: Clock, text: 'Nova proposta enviada para Lead Y', color: 'text-blue-500' },
                                            { icon: AlertCircle, text: 'Aprovação pendente: Banner campanha Z', color: 'text-amber-500' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <item.icon className={cn('h-4 w-4 flex-shrink-0', item.color)} />
                                                <span className="text-xs text-muted-foreground">{item.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    tasks.slice(0, 3).map((task) => (
                                        <div key={task.id} className="flex items-center gap-3">
                                            {task.status === 'done' ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                            ) : task.status === 'waiting_approval' ? (
                                                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                            ) : (
                                                <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                            )}
                                            <span className="text-xs text-muted-foreground truncate">
                                                {task.title}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
