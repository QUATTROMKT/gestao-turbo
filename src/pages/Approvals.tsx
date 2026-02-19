import { useState, useEffect } from 'react';
import {
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    Upload,
    Download,
    MessageSquare,
    Search,
    Filter,
} from 'lucide-react';
import { Card, Button, Input, Badge, Dialog, Textarea, Select, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Approval, ApprovalStatus, Task } from '@/types';

const STATUS_CONFIG = {
    pending: { label: 'Pendente', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
    approved: { label: 'Aprovado', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 },
    rejected: { label: 'Rejeitado', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
};

export function Approvals() {
    const { user, profile } = useAuth();
    const [approvals, setApprovals] = useState<Approval[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [viewingApproval, setViewingApproval] = useState<Approval | null>(null);

    // Upload Form
    const [selectedTask, setSelectedTask] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [fileName, setFileName] = useState('');
    const [uploading, setUploading] = useState(false);

    // Review Form
    const [reviewComment, setReviewComment] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load approvals with related data would be better with join, but keeping simple for MVP
            const { data: approvalsData } = await supabase
                .from('approvals')
                .select('*')
                .order('created_at', { ascending: false });

            const { data: tasksData } = await supabase
                .from('tasks')
                .select('*')
                .in('status', ['in_progress', 'waiting_approval']);

            if (approvalsData) setApprovals(approvalsData as unknown as Approval[]);
            if (tasksData) setTasks(tasksData as unknown as Task[]);
        } catch (err) {
            console.error('Error loading approvals:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!selectedTask || !fileUrl || !fileName) return;

        setUploading(true);
        // In a real app, we would upload to Storage here. 
        // For MVP, we assume fileUrl is a link (Drive/Dropbox) or pre-uploaded URL.

        const { error } = await supabase.from('approvals').insert({
            task_id: selectedTask,
            file_url: fileUrl,
            file_name: fileName,
            status: 'pending',
            submitted_by: user?.id || '',
        });

        if (!error) {
            // Update task status to waiting_approval
            await supabase
                .from('tasks')
                .update({ status: 'waiting_approval' })
                .eq('id', selectedTask);

            setShowUpload(false);
            resetForm();
            loadData();
        }
        setUploading(false);
    };

    const handleReview = async (status: 'approved' | 'rejected') => {
        if (!viewingApproval) return;

        const { error } = await supabase
            .from('approvals')
            .update({
                status,
                comment: reviewComment,
                reviewed_by: user?.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', viewingApproval.id);

        if (!error) {
            // If approved, complete the task
            if (status === 'approved') {
                await supabase
                    .from('tasks')
                    .update({ status: 'done' })
                    .eq('id', viewingApproval.task_id);
            }
            // If rejected, move back to in_progress
            if (status === 'rejected') {
                await supabase
                    .from('tasks')
                    .update({ status: 'in_progress' })
                    .eq('id', viewingApproval.task_id);
            }

            setViewingApproval(null);
            setReviewComment('');
            loadData();
        }
    };

    const resetForm = () => {
        setSelectedTask('');
        setFileUrl('');
        setFileName('');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Aprovações</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gerencie entregas e solicitações de aprovação de clientes
                    </p>
                </div>
                <Button onClick={() => setShowUpload(true)}>
                    <Upload className="h-4 w-4" />
                    Nova Entrega
                </Button>
            </div>

            {/* Approvals Grid */}
            {approvals.length === 0 ? (
                <EmptyState
                    icon={CheckCircle2}
                    title="Nenhuma aprovação pendente"
                    description="Crie uma nova entrega para iniciar o fluxo de aprovação."
                    action={
                        <Button variant="outline" onClick={() => setShowUpload(true)}>
                            <Upload className="h-4 w-4" />
                            Upload de Arquivo
                        </Button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {approvals.map((approval) => {
                        const statusStyle = STATUS_CONFIG[approval.status];
                        const StatusIcon = statusStyle.icon;

                        return (
                            <Card
                                key={approval.id}
                                glass
                                hover
                                className="group cursor-pointer"
                                onClick={() => setViewingApproval(approval)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-accent p-2">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-foreground truncate max-w-[150px]">
                                                {approval.file_name}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(approval.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={cn("px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1", statusStyle.color)}>
                                        <StatusIcon className="h-3 w-3" />
                                        {statusStyle.label}
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-border/30">
                                    <p className="text-xs text-muted-foreground mb-2">Item Vinculado:</p>
                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        <span className="truncate">
                                            {tasks.find(t => t.id === approval.task_id)?.title || 'Tarefa desconhecida'}
                                        </span>
                                    </div>
                                </div>

                                {approval.comment && (
                                    <div className="mt-3 p-2 rounded-lg bg-accent/20 text-xs text-muted-foreground italic">
                                        "{approval.comment}"
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Upload Dialog */}
            <Dialog
                open={showUpload}
                onClose={() => { setShowUpload(false); resetForm(); }}
                title="Nova Entrega"
            >
                <div className="space-y-4">
                    <Select
                        id="approval-task"
                        label="Tarefa Relacionada"
                        options={[
                            { value: '', label: 'Selecione uma tarefa...' },
                            ...tasks.map(t => ({ value: t.id, label: t.title }))
                        ]}
                        value={selectedTask}
                        onChange={(e) => setSelectedTask(e.target.value)}
                    />
                    <Input
                        id="file-name"
                        label="Nome do Arquivo"
                        placeholder="Ex: Criativos Campanha Black Friday"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                    />
                    <Input
                        id="file-url"
                        label="Link do Arquivo (Drive/Dropbox/Storage)"
                        placeholder="https://..."
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => setShowUpload(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpload} disabled={!selectedTask || !fileName || !fileUrl || uploading}>
                            {uploading ? 'Enviando...' : 'Enviar para Aprovação'}
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* Review Dialog */}
            <Dialog
                open={!!viewingApproval}
                onClose={() => { setViewingApproval(null); setReviewComment(''); }}
                title={viewingApproval?.file_name || ''}
            >
                {viewingApproval && (
                    <div className="space-y-6">
                        <div className="flex justify-center py-4 bg-accent/10 rounded-xl">
                            <FileText className="h-16 w-16 text-primary/50" />
                        </div>

                        <div className="flex justify-center gap-2">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => window.open(viewingApproval.file_url, '_blank')}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Baixar / Visualizar
                            </Button>
                        </div>

                        {viewingApproval.status === 'pending' && profile?.role !== 'viewer' && (
                            <div className="pt-4 border-t border-border">
                                <Textarea
                                    id="review-comment"
                                    label="Comentário (opcional)"
                                    placeholder="Feedback sobre a entrega..."
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <Button
                                        variant="outline"
                                        className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                                        onClick={() => handleReview('rejected')}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Rejeitar / Ajustes
                                    </Button>
                                    <Button
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => handleReview('approved')}
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Aprovar
                                    </Button>
                                </div>
                            </div>
                        )}

                        {viewingApproval.status !== 'pending' && (
                            <div className={cn("p-3 rounded-xl border text-center font-medium", STATUS_CONFIG[viewingApproval.status].color)}>
                                {STATUS_CONFIG[viewingApproval.status].label}
                                {viewingApproval.reviewed_by && (
                                    <span className="block text-xs font-normal opacity-80 mt-1">
                                        Feedback enviado
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Dialog>
        </div>
    );
}
