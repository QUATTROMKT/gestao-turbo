import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { Plus, DollarSign, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PipelineDeal } from '@/types';

const STAGES = [
    { id: 'lead', label: 'Leads', color: 'bg-blue-500/10 text-blue-500' },
    { id: 'proposal', label: 'Proposta', color: 'bg-purple-500/10 text-purple-500' },
    { id: 'negotiation', label: 'Negociação', color: 'bg-orange-500/10 text-orange-500' },
    { id: 'closed_won', label: 'Fechado Ganho', color: 'bg-green-500/10 text-green-500' },
    { id: 'closed_lost', label: 'Perdido', color: 'bg-red-500/10 text-red-500' },
];

export function Pipeline() {
    const [deals, setDeals] = useState<PipelineDeal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDeals();
    }, []);

    const fetchDeals = async () => {
        try {
            const { data, error } = await supabase
                .from('pipeline_deals')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDeals(data || []);
        } catch (error) {
            console.error('Error fetching deals:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStageTotal = (stage: string) => {
        return deals
            .filter(d => d.stage === stage)
            .reduce((acc, curr) => acc + (curr.value || 0), 0);
    };

    return (
        <div className="space-y-6 animate-fade-in h-[calc(100vh-6rem)] flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Pipeline de Vendas</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gerencie suas oportunidades de negócio
                    </p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Deal
                </Button>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4 h-full min-w-[1000px]">
                    {STAGES.map(stage => (
                        <div key={stage.id} className="w-72 flex-shrink-0 flex flex-col gap-4">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/50">
                                <div className="flex items-center gap-2">
                                    <Badge className={stage.color}>{deals.filter(d => d.stage === stage.id).length}</Badge>
                                    <span className="font-medium text-sm">{stage.label}</span>
                                </div>
                                <span className="text-xs font-mono text-muted-foreground">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getStageTotal(stage.id))}
                                </span>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                                {deals.filter(d => d.stage === stage.id).map(deal => (
                                    <Card key={deal.id} hover className="cursor-pointer group">
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold text-sm line-clamp-2">{deal.company_name}</h4>
                                                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                                </button>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">{deal.contact_name}</p>
                                                {deal.email && <p className="text-xs text-muted-foreground truncate">{deal.email}</p>}
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                                <Badge variant="outline" className="text-xs font-mono">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {deal.probability}%
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {deals.filter(d => d.stage === stage.id).length === 0 && (
                                    <div className="h-24 border-2 border-dashed border-border/50 rounded-xl flex items-center justify-center">
                                        <span className="text-xs text-muted-foreground">Vazio</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
