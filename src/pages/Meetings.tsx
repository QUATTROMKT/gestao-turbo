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
        // Load mock data for now or fetch from specific tables
        // In a real app, we would fetch existing issues/headlines/todos linked to this meeting or general ones
        fetchIssues(meetingId);
    };

    const fetchIssues = async (meetingId: string) => {
        const { data } = await supabase.from('meeting_issues').select('*').eq('meeting_id', meetingId);
        if (data) setIssues(data as unknown as MeetingIssue[]);
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
                    <div className="text-center py-10 space-y-4">
                        <h2 className="text-2xl font-bold">Good News (Segue)</h2>
                        <p className="text-muted-foreground">Compartilhe uma vitória pessoal e uma profissional da semana.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                            <Card className="p-4 border-dashed">Profissional</Card>
                            <Card className="p-4 border-dashed">Pessoal</Card>
                        </div>
                    </div>
                );
            case 'ids':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">IDS: Identify, Discuss, Solve</h2>
                            <Button size="sm" onClick={() => setShowIssueDialog(true)}><Plus className="h-4 w-4" /> New Issue</Button>
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
            default:
                return (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
                        <Clock className="h-10 w-10 mb-2" />
                        <p>Seção em desenvolvimento: {AGENDA_STEPS[currentStep].label}</p>
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
