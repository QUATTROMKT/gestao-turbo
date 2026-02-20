import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    GripVertical,
    MoreHorizontal,
    Clock,
    Calendar,
    User,
    CheckCircle2,
    AlertCircle,
    Loader2,
    X,
} from 'lucide-react';
import { Card, Button, Input, Badge, Dialog, Textarea, Select, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { Task, TaskStatus, TaskPriority, Client } from '@/types';

const COLUMNS: { id: TaskStatus; title: string; color: string; icon: typeof Clock }[] = [
    { id: 'todo', title: 'A Fazer', color: 'border-blue-500/50', icon: Clock },
    { id: 'in_progress', title: 'Em Progresso', color: 'border-purple-500/50', icon: Loader2 },
    { id: 'waiting_approval', title: 'Aguardando Aprovação', color: 'border-amber-500/50', icon: AlertCircle },
    { id: 'done', title: 'Concluído', color: 'border-emerald-500/50', icon: CheckCircle2 },
];

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Baixa', color: 'text-blue-400' },
    { value: 'medium', label: 'Média', color: 'text-amber-400' },
    { value: 'high', label: 'Alta', color: 'text-orange-500' },
    { value: 'urgent', label: 'Urgente', color: 'text-red-500' },
];

const priorityBadgeVariant = (p: TaskPriority) => {
    switch (p) {
        case 'low': return 'outline' as const;
        case 'medium': return 'warning' as const;
        case 'high': return 'destructive' as const;
        case 'urgent': return 'destructive' as const;
    }
};

export function Operations() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterClient, setFilterClient] = useState('');
    const [showNewTask, setShowNewTask] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [dragTask, setDragTask] = useState<string | null>(null);

    // New task form
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
    const [newClientId, setNewClientId] = useState('');
    const [newAssigneeId, setNewAssigneeId] = useState('');
    const [newDueDate, setNewDueDate] = useState('');

    const [users, setUsers] = useState<{ id: string; full_name: string }[]>([]);

    useEffect(() => {
        loadData();
        loadUsers();
        // Subscribe to real-time changes
        const channel = supabase
            .channel('tasks-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                () => loadData()
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const loadData = async () => {
        try {
            const [tasksRes, clientsRes] = await Promise.all([
                supabase.from('tasks').select('*, assignee:profiles(full_name)').order('order_index', { ascending: true }),
                supabase.from('clients').select('*'),
            ]);
            if (tasksRes.data) setTasks(tasksRes.data as unknown as Task[]);
            if (clientsRes.data) setClients(clientsRes.data as Client[]);
        } catch (err) {
            console.error('Error loading tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        const { data } = await supabase.from('profiles').select('id, full_name');
        if (data) setUsers(data);
    };

    const createTask = async () => {
        if (!newTitle.trim()) return;

        const task = {
            title: newTitle,
            description: newDescription || null,
            priority: newPriority,
            status: 'todo' as TaskStatus,
            client_id: newClientId || null,
            assignee_id: newAssigneeId || null,
            due_date: newDueDate || null,
            tags: [],
            order_index: tasks.filter((t) => t.status === 'todo').length,
        };

        const { error } = await supabase.from('tasks').insert(task);
        if (!error) {
            setShowNewTask(false);
            resetForm();
            loadData();
        }
    };

    const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
        const { error } = await supabase
            .from('tasks')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', taskId);
        if (!error) loadData();
    };

    const deleteTask = async (taskId: string) => {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (!error) loadData();
    };

    const resetForm = () => {
        setNewTitle('');
        setNewDescription('');
        setNewPriority('medium');
        setNewClientId('');
        setNewAssigneeId('');
        setNewDueDate('');
    };

    // Filter tasks
    const filteredTasks = tasks.filter((t) => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesClient = !filterClient || t.client_id === filterClient;
        return matchesSearch && matchesClient;
    });

    const getTasksByStatus = (status: TaskStatus) =>
        filteredTasks.filter((t) => t.status === status);

    // Simple drag and drop using HTML5 API
    const handleDragStart = (taskId: string) => setDragTask(taskId);
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = (status: TaskStatus) => {
        if (dragTask) {
            updateTaskStatus(dragTask, status);
            setDragTask(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Central de Operações</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gerencie tarefas da equipe — arraste entre colunas
                    </p>
                </div>
                <Button onClick={() => setShowNewTask(true)}>
                    <Plus className="h-4 w-4" />
                    Nova Tarefa
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar tarefa..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                </div>
                <Select
                    id="filter-client"
                    options={[
                        { value: '', label: 'Todos os clientes' },
                        ...clients.map((c) => ({ value: c.id, label: c.company_name })),
                    ]}
                    value={filterClient}
                    onChange={(e) => setFilterClient(e.target.value)}
                    className="sm:w-48"
                />
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {COLUMNS.map((col) => {
                    const colTasks = getTasksByStatus(col.id);
                    return (
                        <div
                            key={col.id}
                            className={cn(
                                'rounded-2xl border-t-2 bg-accent/20 p-3 min-h-[400px]',
                                col.color
                            )}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(col.id)}
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-3 px-1">
                                <div className="flex items-center gap-2">
                                    <col.icon className="h-4 w-4 text-muted-foreground" />
                                    <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-muted-foreground">
                                        {colTasks.length}
                                    </span>
                                </div>
                            </div>

                            {/* Task Cards */}
                            <div className="space-y-2">
                                {colTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={() => handleDragStart(task.id)}
                                        className={cn(
                                            'group cursor-grab rounded-xl border border-border/50 bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border active:cursor-grabbing',
                                            dragTask === task.id && 'opacity-50'
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2 flex-1">
                                                <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground leading-tight">
                                                        {task.title}
                                                    </p>
                                                    {task.description && (
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteTask(task.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant={priorityBadgeVariant(task.priority)}>
                                                {PRIORITIES.find((p) => p.value === task.priority)?.label}
                                            </Badge>
                                            {task.client_name && (
                                                <span className="text-[10px] text-muted-foreground truncate">
                                                    {task.client_name}
                                                </span>
                                            )}
                                            {task.due_date && (
                                                <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(task.due_date).toLocaleDateString('pt-BR', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {colTasks.length === 0 && (
                                    <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                                        Nenhuma tarefa
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* New Task Dialog */}
            <Dialog
                open={showNewTask}
                onClose={() => { setShowNewTask(false); resetForm(); }}
                title="Nova Tarefa"
            >
                <div className="space-y-4">
                    <Input
                        id="task-title"
                        label="Título"
                        placeholder="Descreva a tarefa..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        required
                    />
                    <Textarea
                        id="task-description"
                        label="Descrição (opcional)"
                        placeholder="Detalhes adicionais..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            id="task-priority"
                            label="Prioridade"
                            options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
                            value={newPriority}
                            onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                        />
                        <Select
                            id="task-client"
                            label="Cliente"
                            options={[
                                { value: '', label: 'Nenhum' },
                                ...clients.map((c) => ({ value: c.id, label: c.company_name })),
                            ]}
                            value={newClientId}
                            onChange={(e) => setNewClientId(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            id="task-assignee"
                            label="Responsável"
                            options={[
                                { value: '', label: 'Sem responsável' },
                                ...users.map((u) => ({ value: u.id, label: u.full_name })),
                            ]}
                            value={newAssigneeId}
                            onChange={(e) => setNewAssigneeId(e.target.value)}
                        />
                        <Input
                            id="task-due-date"
                            label="Data Limite"
                            type="date"
                            value={newDueDate}
                            onChange={(e) => setNewDueDate(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => { setShowNewTask(false); resetForm(); }}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={createTask} disabled={!newTitle.trim()}>
                            Criar Tarefa
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
