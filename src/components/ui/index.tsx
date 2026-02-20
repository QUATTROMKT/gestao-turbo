import { cn } from '@/lib/utils';
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, HTMLAttributes } from 'react';

// ── Card ──────────────────────────────────────────

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    glass?: boolean;
    hover?: boolean;
}

export function Card({ children, className, glass, hover, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'rounded-2xl border border-border/50 bg-card p-6 shadow-sm',
                glass && 'glass',
                hover && 'glass-hover cursor-pointer',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('flex items-center justify-between pb-4', className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={cn('text-sm font-semibold text-foreground', className)} {...props}>
            {children}
        </h3>
    );
}

export function CardContent({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('', className)} {...props}>
            {children}
        </div>
    );
}

// ── Button ────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon';
}

export function Button({
    children,
    className,
    variant = 'primary',
    size = 'md',
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                {
                    primary:
                        'gradient-primary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]',
                    secondary:
                        'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                    ghost: 'hover:bg-accent hover:text-accent-foreground',
                    destructive:
                        'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                    outline:
                        'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground',
                }[variant],
                {
                    sm: 'h-8 px-3 text-xs',
                    md: 'h-10 px-4 text-sm',
                    lg: 'h-12 px-6 text-base',
                    icon: 'h-10 w-10',
                }[size],
                className
            )}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}

// ── Input ─────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export function Input({ className, label, error, id, ...props }: InputProps) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={id} className="text-sm font-medium text-foreground">
                    {label}
                </label>
            )}
            <input
                id={id}
                className={cn(
                    'flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                    error && 'border-destructive focus-visible:ring-destructive',
                    className
                )}
                {...props}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

// ── Textarea ──────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export function Textarea({ className, label, error, id, ...props }: TextareaProps) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={id} className="text-sm font-medium text-foreground">
                    {label}
                </label>
            )}
            <textarea
                id={id}
                className={cn(
                    'flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none',
                    error && 'border-destructive focus-visible:ring-destructive',
                    className
                )}
                {...props}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

// ── Badge ─────────────────────────────────────────

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline';
}

export function Badge({ children, className, variant = 'default', ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-colors',
                {
                    default: 'bg-primary/10 text-primary',
                    success: 'bg-success/10 text-success',
                    warning: 'bg-warning/10 text-warning',
                    destructive: 'bg-destructive/10 text-destructive',
                    outline: 'border border-border text-muted-foreground',
                }[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}

// ── Select ────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { value: string; label: string }[];
}

export function Select({ className, label, options, id, ...props }: SelectProps) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={id} className="text-sm font-medium text-foreground">
                    {label}
                </label>
            )}
            <select
                id={id}
                className={cn(
                    'flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    className
                )}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

// ── Dialog / Modal ────────────────────────────────

interface DialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
}

export function Dialog({ open, onClose, title, children, maxWidth = 'max-w-lg' }: DialogProps) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                className={cn(
                    'relative z-10 w-full rounded-2xl border border-border/50 bg-card p-6 shadow-2xl animate-scale-in',
                    maxWidth,
                    'mx-4'
                )}
            >
                <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>
                {children}
            </div>
        </div>
    );
}

// ── Empty State ───────────────────────────────────

interface EmptyStateProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <div className="mb-4 rounded-2xl bg-accent/50 p-4">
                <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

// ── Progress Bar ──────────────────────────────────

interface ProgressProps {
    value: number;
    max?: number;
    variant?: 'primary' | 'success' | 'warning' | 'destructive';
    size?: 'sm' | 'md';
    showLabel?: boolean;
}

export function Progress({
    value,
    max = 100,
    variant = 'primary',
    size = 'md',
    showLabel,
    className,
}: ProgressProps & { className?: string }) {
    const pct = Math.min((value / max) * 100, 100);
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div
                className={cn(
                    'flex-1 overflow-hidden rounded-full bg-accent',
                    size === 'sm' ? 'h-1.5' : 'h-2.5'
                )}
            >
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-500 ease-out',
                        {
                            primary: 'gradient-primary',
                            success: 'bg-success',
                            warning: 'bg-warning',
                            destructive: 'bg-destructive',
                        }[variant]
                    )}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {showLabel && (
                <span className="text-xs font-medium text-muted-foreground min-w-[36px] text-right">
                    {Math.round(pct)}%
                </span>
            )}
        </div>
    );
}

// ── Tabs ──────────────────────────────────────────

interface TabsProps {
    tabs: { id: string; label: string; count?: number }[];
    active: string;
    onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
    return (
        <div className="flex gap-1 rounded-xl bg-accent/50 p-1">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200',
                        active === tab.id
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    {tab.label}
                    {tab.count !== undefined && (
                        <span
                            className={cn(
                                'rounded-full px-1.5 text-[10px] font-bold',
                                active === tab.id
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground'
                            )}
                        >
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
