import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Select } from '@/components/ui';
import { MetaService } from '@/lib/meta';
import {
    BarChart3,
    TrendingUp,
    Users,
    DollarSign,
    MousePointer2,
    PieChart,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
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
    Legend
} from 'recharts';

export function Reports() {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'last_7d' | 'last_30d' | 'this_month'>('last_30d');
    const [insights, setInsights] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [dateRange]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await MetaService.getInsights(dateRange);
            setInsights(data);
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex h-96 items-center justify-center text-muted-foreground animate-pulse">Carregando dados do Meta Ads...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Relatórios de Performance</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Acompanhe o desempenho das campanhas de tráfego pago
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <select
                        className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as any)}
                    >
                        <option value="last_7d">Últimos 7 dias</option>
                        <option value="last_30d">Últimos 30 dias</option>
                        <option value="this_month">Este Mês</option>
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Investimento (Spend)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {insights?.spend?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1 text-emerald-500" />
                            <span className="text-emerald-500 font-medium">+12%</span> vs período anterior
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Leads (CPL)</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{insights?.actions?.find((a: any) => a.action_type === 'lead')?.value || 0}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <span className="text-muted-foreground">Custo por Lead: </span>
                            <span className="ml-1 font-medium text-foreground">
                                R$ {((insights?.spend || 0) / (insights?.actions?.find((a: any) => a.action_type === 'lead')?.value || 1)).toFixed(2)}
                            </span>
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Impressões</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(insights?.impressions || 0).toLocaleString('pt-BR')}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            CPM: R$ {insights?.cpm?.toFixed(2)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cliques (CTR)</CardTitle>
                        <MousePointer2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(insights?.clicks || 0).toLocaleString('pt-BR')}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            CTR: <span className="text-emerald-500 font-medium ml-1">{insights?.ctr?.toFixed(2)}%</span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Main Trend Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Tendência de Investimento vs Leads</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[
                                    { name: 'Semana 1', spend: 400, leads: 12 },
                                    { name: 'Semana 2', spend: 300, leads: 8 },
                                    { name: 'Semana 3', spend: 550, leads: 18 },
                                    { name: 'Semana 4', spend: 450, leads: 15 },
                                ]}>
                                    <defs>
                                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                    <XAxis dataKey="name" className="text-xs text-muted-foreground" axisLine={false} tickLine={false} />
                                    <YAxis className="text-xs text-muted-foreground" axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="spend" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSpend)" name="Investimento" />
                                    <Area type="monotone" dataKey="leads" stroke="#10b981" fillOpacity={1} fill="url(#colorLeads)" name="Leads" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Campaign Breakdown */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top Campanhas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { name: 'Institucional - Branding', spend: 450, roas: 3.2 },
                                { name: 'Promoção Black Friday', spend: 320, roas: 5.1 },
                                { name: 'Captação Leads - Ebook', spend: 280, roas: 2.8 },
                                { name: 'Retargeting Website', spend: 120, roas: 4.5 },
                            ].map((campaign, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{campaign.name}</p>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2" />
                                            Ativa
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold">R$ {campaign.spend}</div>
                                        <div className="text-xs text-muted-foreground">ROAS: {campaign.roas}x</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
