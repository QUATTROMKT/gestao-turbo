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
                        <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground border border-dashed rounded-xl">
                            {insights ? (
                                <p>Gráfico indisponível (API do Meta limitada a dados agregados por enquanto).</p>
                            ) : (
                                <p>Conecte o Meta Ads em Configurações para ver dados.</p>
                            )}
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
                            {/* Placeholder for future campaign breakdown */}
                            <div className="p-4 text-center text-muted-foreground border border-dashed rounded-lg">
                                Listagem de campanhas em desenvolvimento.
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
