import { useState, useEffect } from 'react';
import {
    CheckCircle2,
    Clock,
    Download,
    FileText,
    BarChart3,
    TrendingUp,
    Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, EmptyState } from '@/components/ui';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Task, ClientFile } from '@/types';

export function ClientPortal() {
    const { profile } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [files, setFiles] = useState<ClientFile[]>([]);
    const [loading, setLoading] = useState(true);

    const clientId = profile?.client_id;

    useEffect(() => {
        if (clientId) loadData();
        else setLoading(false);
    }, [clientId]);

    const loadData = async () => {
        try {
            const [tasksRes, filesRes] = await Promise.all([
                supabase.from('tasks').select('*').eq('client_id', clientId!).order('updated_at', { ascending: false }),
                supabase.from('client_files').select('*').eq('client_id', clientId!).order('created_at', { ascending: false }),
            ]);
            if (tasksRes.data) setTasks(tasksRes.data as unknown as Task[]);
            if (filesRes.data) setFiles(filesRes.data as unknown as ClientFile[]);
        } catch (err) {
            console.error('Error loading portal data:', err);
        } finally {
            setLoading(false);
        }
    };

    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
    const waitingTasks = tasks.filter((t) => t.status === 'waiting_approval').length;

    if (!clientId) {
        return (
            <div className="space-y-6 animate-fade-in">
                <h1 className="text-2xl font-bold text-foreground">Meu Portal</h1>
                <EmptyState
                    icon={Eye}
                    title="Portal não configurado"
                    description="Seu acesso ainda não foi vinculado a um cliente. Solicite ao administrador da agência."
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Meu Portal</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Acompanhe o status do seu projeto em tempo real
                </p>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card glass>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-500/10 p-2.5">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Concluídas</p>
                            <p className="text-xl font-bold text-foreground">{completedTasks}</p>
                        </div>
                    </div>
                </Card>
                <Card glass>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-500/10 p-2.5">
                            <Clock className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Em progresso</p>
                            <p className="text-xl font-bold text-foreground">{inProgressTasks}</p>
                        </div>
                    </div>
                </Card>
                <Card glass>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-amber-500/10 p-2.5">
                            <Clock className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
                            <p className="text-xl font-bold text-foreground">{waitingTasks}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Project Timeline */}
            <Card glass>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Status do Projeto
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {tasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            Nenhuma tarefa ainda. Sua equipe começará em breve!
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {tasks.slice(0, 10).map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-3 rounded-xl bg-accent/30 p-3"
                                >
                                    {task.status === 'done' ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                    ) : task.status === 'waiting_approval' ? (
                                        <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                    ) : (
                                        <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                    )}
                                    <span className="text-sm text-foreground flex-1">{task.title}</span>
                                    <Badge
                                        variant={
                                            task.status === 'done'
                                                ? 'success'
                                                : task.status === 'waiting_approval'
                                                    ? 'warning'
                                                    : 'default'
                                        }
                                    >
                                        {task.status === 'done'
                                            ? 'Concluído'
                                            : task.status === 'in_progress'
                                                ? 'Em Progresso'
                                                : task.status === 'waiting_approval'
                                                    ? 'Aprovação'
                                                    : 'A Fazer'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Files */}
            <Card glass>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Arquivos do Projeto
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {files.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            Nenhum arquivo disponível ainda.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between rounded-xl bg-accent/30 p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{file.file_name}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {(file.file_size / 1024).toFixed(0)} KB ·{' '}
                                                {new Date(file.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={file.file_path}
                                        target="_blank"
                                        rel="noopener"
                                        className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                    >
                                        <Download className="h-4 w-4" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Campaign Results Placeholder */}
            <Card glass>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Resultados de Campanhas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {[
                            { label: 'Investido', value: 'R$ 0' },
                            { label: 'Leads', value: '0' },
                            { label: 'CPL', value: 'R$ 0' },
                            { label: 'ROAS', value: '0x' },
                        ].map((metric) => (
                            <div key={metric.label} className="text-center">
                                <p className="text-xs text-muted-foreground">{metric.label}</p>
                                <p className="text-lg font-bold text-foreground mt-1">{metric.value}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-4">
                        Os dados de campanhas serão integrados automaticamente quando a integração Meta/Google Ads for ativada.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
