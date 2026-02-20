import { useState, useEffect } from 'react';
import {
    Calendar,
    CheckCircle2,
    Clock,
    MessageSquare,
    AlertCircle,
    TrendingUp,
    ListTodo,
    Play,
    Check,
    Plus,
    Trash2,
    ChevronRight,
} from 'lucide-react';
import { Card, Button, Input, Badge, Dialog, Textarea, Select, Tabs, Progress } from '@/components/ui';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { MeetingL10, MeetingIssue, MeetingHeadline, MeetingTodo, Rock, ScorecardMetric } from '@/types';

// L10 Meeting Agenda Steps
const AGENDA_STEPS = [
    { id: 'segue', label: 'Segue', duration: 5, icon: MessageSquare },
    { id: 'scorecard', label: 'Scorecard', duration: 5, icon: TrendingUp },
    { id: 'rock_review', label: 'Rock Review', duration: 5, icon: CheckCircle2 },
    { id: 'headlines', label: 'Headlines', duration: 5, icon: MessageSquare },
    { id: 'todo_list', label: 'To-Do List', duration: 5, icon: ListTodo },
    { id: 'ids', label: 'IDS (Issues)', duration: 60, icon: AlertCircle },
    { id: 'conclusion', label: 'Conclusion', duration: 5, icon: Check },
];

export function Meetings() {
    const { user } = useAuth();
    const [activeMeeting, setActiveMeeting] = useState<MeetingL10 | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0); // seconds

    // Meeting Data
    const [headlines, setHeadlines] = useState<MeetingHeadline[]>([]);
    const [issues, setIssues] = useState<MeetingIssue[]>([]);
    const [todos, setTodos] = useState<MeetingTodo[]>([]);
    const [rocks, setRocks] = useState<Rock[]>([]);
    const [metrics, setMetrics] = useState<ScorecardMetric[]>([]);

    // Dialogs
    const [showIssueDialog, setShowIssueDialog] = useState(false);
    const [newIssueTitle, setNewIssueTitle] = useState('');

    // Timer
    useEffect(() => {
        let interval: any;
        if (activeMeeting && startTime) {
            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeMeeting, startTime]);

    const startMeeting = async () => {
        // Create new meeting
        const { data, error } = await supabase.from('meetings_l10').insert({
            title: `News L10 - ${new Date().toLocaleDateString()}`,
            status: 'in_progress',
            date: new Date().toISOString(),
        }).select().single();

        if (data) {
            setActiveMeeting(data as unknown as MeetingL10);
            setStartTime(Date.now());
            loadMeetingData(data.id);
        }
    };

    const loadMeetingData = async (meetingId: string) => {
        try {
            await Promise.all([
                fetchHeadlines(meetingId),
                fetchIssues(meetingId),
                fetchTodos(meetingId),
                fetchRocks(),
                fetchScorecard()
            ]);
        } catch (error) {
            console.error('Error loading meeting data:', error);
        }
    };

    const fetchIssues = async (meetingId: string) => {
        const { data } = await supabase.from('meeting_issues').select('*').eq('meeting_id', meetingId).order('created_at', { ascending: true });
        if (data) setIssues(data as unknown as MeetingIssue[]);
    };

    const fetchHeadlines = async (meetingId: string) => {
        const { data } = await supabase.from('meeting_headlines').select('*').eq('meeting_id', meetingId);
        if (data) setHeadlines(data as unknown as MeetingHeadline[]);
    };

    const fetchTodos = async (meetingId: string) => {
        const { data } = await supabase.from('meeting_todos').select('*').eq('meeting_id', meetingId);
        if (data) setTodos(data as unknown as MeetingTodo[]);
    };

    const fetchRocks = async () => {
        // Fetch rocks relevant to the team (all for now)
        const { data } = await supabase.from('rocks').select('*');
        if (data) setRocks(data as unknown as Rock[]);
    };

    const fetchScorecard = async () => {
        const { data } = await supabase.from('scorecard_metrics').select('*');
        if (data) setMetrics(data as unknown as ScorecardMetric[]);
    };

    const addIssue = async () => {
        if (!activeMeeting || !newIssueTitle) return;
        const { error } = await supabase.from('meeting_issues').insert({
            meeting_id: activeMeeting.id,
            title: newIssueTitle,
            priority: 'medium',
            status: 'open',
        });
        if (!error) {
            setShowIssueDialog(false);
            setNewIssueTitle('');
            fetchIssues(activeMeeting.id);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const StepContent = () => {
        switch (AGENDA_STEPS[currentStep].id) {
            case 'segue':
                return (
                    <div className="text-center py-10 space-y-6">
                        <h2 className="text-2xl font-bold">Good News (Segue)</h2>
                        <p className="text-muted-foreground">Compartilhe uma vitória pessoal e uma profissional da semana.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                            <Card className="p-6 border-dashed hover:border-primary/50 transition-colors">
                                <h3 className="font-semibold mb-2">Profissional</h3>
                                <Textarea placeholder="Qual foi a melhor coisa que aconteceu no trabalho?" className="min-h-[100px] bg-transparent" />
                            </Card>
                            <Card className="p-6 border-dashed hover:border-primary/50 transition-colors">
                                <h3 className="font-semibold mb-2">Pessoal</h3>
                                <Textarea placeholder="E na sua vida pessoal?" className="min-h-[100px] bg-transparent" />
                            </Card>
                        </div>
                    </div>
                );
            case 'scorecard':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Scorecard Review</h2>
                        <div className="rounded-xl border border-border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-accent/50">
                                    <tr>
                                        <th className="p-3 text-left">Métrica</th>
                                        <th className="p-3 text-right">Meta</th>
                                        <th className="p-3 text-right">Atual</th>
                                        <th className="p-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metrics.map(metric => (
                                        <tr key={metric.id} className="border-t border-border/50">
                                            <td className="p-3 font-medium">{metric.name}</td>
                                            <td className="p-3 text-right text-muted-foreground">{metric.target} {metric.unit}</td>
                                            <td className="p-3 text-right font-bold">{metric.actual}</td>
                                            <td className="p-3 text-center">
                                                <Badge variant={metric.on_track ? 'success' : 'destructive'} className="uppercase text-[10px]">
                                                    {metric.on_track ? 'On Track' : 'Off Track'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                    {metrics.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhuma métrica cadastrada.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'rock_review':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Rock Review</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {rocks.map(rock => (
                                <Card key={rock.id} className="p-4 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <span className="font-semibold">{rock.title}</span>
                                        <Badge variant={rock.status === 'on_track' ? 'success' : rock.status === 'done' ? 'default' : 'destructive'}>
                                            {rock.status === 'on_track' ? 'On Track' : rock.status === 'done' ? 'Done' : 'Off Track'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{rock.description}</p>
                                    <div className="mt-auto pt-2">
                                        <Progress value={rock.progress} className="h-2" />
                                    </div>
                                </Card>
                            ))}
                            {rocks.length === 0 && (
                                <div className="col-span-full text-center py-8 text-muted-foreground border border-dashed rounded-xl">
                                    Nenhum Rock definido para este trimestre.
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'headlines':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Headlines (Customer/Employee)</h2>
                            <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
                        </div>
                        <div className="space-y-2">
                            {headlines.map(headline => (
                                <div key={headline.id} className="flex items-center gap-3 p-3 bg-accent/20 rounded-xl">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                    <span className="flex-1 font-medium">{headline.title}</span>
                                    <Badge variant="outline" className="capitalize">{headline.type}</Badge>
                                </div>
                            ))}
                            {headlines.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhuma headline registrada.</p>}
                        </div>
                    </div>
                );
            case 'todo_list':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">To-Do List (Review)</h2>
                        <div className="space-y-2">
                            {todos.map(todo => (
                                <div key={todo.id} className="flex items-center gap-3 p-3 border border-border rounded-xl">
                                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center cursor-pointer ${todo.completed ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                                        {todo.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                                    </div>
                                    <span className={cn("flex-1", todo.completed && "line-through text-muted-foreground")}>{todo.title}</span>
                                </div>
                            ))}
                            {todos.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhum to-do pendente.</p>}
                        </div>
                    </div>
                );
            case 'ids':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">IDS: Identify, Discuss, Solve</h2>
                            <Button size="sm" onClick={() => setShowIssueDialog(true)}><Plus className="h-4 w-4 mr-1" /> New Issue</Button>
                        </div>
                        <div className="space-y-2">
                            {issues.map(issue => (
                                <div key={issue.id} className="flex items-center gap-3 p-3 bg-accent/20 rounded-xl">
                                    <AlertCircle className="h-5 w-5 text-destructive" />
                                    <span className="flex-1 font-medium">{issue.title}</span>
                                    <Button size="sm" variant="ghost">Solve</Button>
                                </div>
                            ))}
                            {issues.length === 0 && <p className="text-muted-foreground text-center py-4">No issues yet.</p>}
                        </div>
                    </div>
                );
            case 'conclusion':
                return (
                    <div className="text-center py-10 space-y-6">
                        <h2 className="text-2xl font-bold">Conclusão</h2>
                        <p className="text-muted-foreground">Classifique a reunião de 1 a 10.</p>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                                <Button key={rating} variant="outline" className="h-10 w-10 p-0 rounded-full">{rating}</Button>
                            ))}
                        </div>
                        <Button size="lg" className="mt-8" onClick={() => setActiveMeeting(null)}>
                            Encerrar Reunião
                        </Button>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
                        <Clock className="h-10 w-10 mb-2" />
                        <p>Seção não encontrada.</p>
                    </div>
                );
        }
    };

    if (!activeMeeting) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Reuniões L10 (EOS)</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Reuniões semanais de 90 minutos para alinhar a equipe e resolver problemas.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card glass className="p-6 flex flex-col items-center justify-center text-center gap-4 py-12">
                        <Calendar className="h-12 w-12 text-primary opacity-80" />
                        <div>
                            <h3 className="text-lg font-bold">Iniciar Nova Reunião L10</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                                Comece agora seguindo a pauta padrão EOS: Segue, Scorecard, Rocks, Headlines, To-dos, IDS e Conclusão.
                            </p>
                        </div>
                        <Button size="lg" onClick={startMeeting} className="mt-4">
                            <Play className="h-4 w-4" />
                            Começar Reunião L10
                        </Button>
                    </Card>

                    <Card glass>
                        <div className="p-4 border-b border-border/50">
                            <h3 className="font-semibold text-sm">Histórico</h3>
                        </div>
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Nenhuma reunião realizada ainda.
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col animate-fade-in">
            {/* Meeting Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{activeMeeting.title}</h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(elapsedTime)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            Em Andamento
                        </span>
                    </div>
                </div>
                <Button variant="destructive" onClick={() => setActiveMeeting(null)}>
                    Encerrar Reunião
                </Button>
            </div>

            {/* Agenda Progress */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                {AGENDA_STEPS.map((step, index) => {
                    const isActive = index === currentStep;
                    const isDone = index < currentStep;
                    const StepIcon = step.icon;

                    return (
                        <button
                            key={step.id}
                            onClick={() => setCurrentStep(index)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                                    : isDone
                                        ? "bg-accent text-accent-foreground opacity-70"
                                        : "bg-accent/30 text-muted-foreground"
                            )}
                        >
                            <StepIcon className="h-3.5 w-3.5" />
                            {step.label}
                            <span className="text-[10px] opacity-60 ml-1">({step.duration}m)</span>
                        </button>
                    );
                })}
            </div>

            {/* Main Content Area */}
            <Card className="flex-1 p-6 relative bg-background/50 backdrop-blur-sm border-border">
                <div className="absolute top-4 right-4">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentStep(prev => Math.min(prev + 1, AGENDA_STEPS.length - 1))}
                        disabled={currentStep === AGENDA_STEPS.length - 1}
                    >
                        Próximo
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="max-w-4xl mx-auto h-full overflow-y-auto">
                    <StepContent />
                </div>
            </Card>

            {/* Dialogs */}
            <Dialog open={showIssueDialog} onClose={() => setShowIssueDialog(false)} title="New Issue">
                <div className="space-y-4">
                    <Input
                        value={newIssueTitle}
                        onChange={e => setNewIssueTitle(e.target.value)}
                        placeholder="What is the issue?"
                    />
                    <div className="flex justify-end gap-2">
                        <Button onClick={addIssue}>Add Issue</Button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
