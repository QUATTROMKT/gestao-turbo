import type { ComponentType } from 'react';

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface Profile {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    role: UserRole;
    client_id?: string;
    created_at: string;
    updated_at?: string;
}

export interface NavItem {
    icon: ComponentType<{ className?: string }>;
    label: string;
    href: string;
    roles?: UserRole[];
    badge?: number;
}

export type ClientStatus = 'active' | 'churn' | 'negotiation';

export interface Client {
    id: string;
    company_name: string;
    decision_maker: string;
    email?: string;
    phone?: string;
    niche: string;
    status: ClientStatus;
    contract_value: number;
    contract_duration: number;
    start_date: string;
    ltv: number;
    drive_link?: string;
    notes?: string;
    created_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'waiting_approval' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
    id: string;
    title: string;
    description?: string;
    client_id?: string;
    client_name?: string; // Optional join field
    assignee_id?: string;
    assignee_name?: string; // Optional join field
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string;
    tags?: string[];
    order_index: number;
    created_at: string;
    updated_at: string;
}

export interface Rock {
    id: string;
    title: string;
    description?: string;
    owner_id: string;
    owner_name?: string; // join
    progress: number;
    status: 'on_track' | 'off_track' | 'done';
    quarter: string;
    due_date: string;
}

export interface ScorecardMetric {
    id: string;
    name: string;
    owner_id: string;
    target: number;
    actual: number;
    unit: string;
    week: string;
    on_track: boolean;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Approval {
    id: string;
    task_id: string;
    task_title?: string;
    client_id?: string;
    client_name?: string;
    file_url: string;
    file_name: string;
    status: ApprovalStatus;
    comment?: string;
    submitted_by: string;
    reviewed_by?: string;
    created_at: string;
}

export type ParaCategory = 'projects' | 'areas' | 'resources' | 'archive';

export interface SOP {
    id: string;
    title: string;
    content: string;
    category: ParaCategory;
    client_id?: string;
    tags?: string[];
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface PipelineDeal {
    id: string;
    company_name: string;
    contact_name: string;
    email?: string;
    value: number;
    stage: 'lead' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
    probability: number;
    notes?: string;
}

export interface ClientFile {
    id: string;
    client_id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    created_at: string;
}

export interface MeetingL10 {
    id: string;
    title: string;
    date: string;
    duration_minutes: number;
    score: number;
    status: 'scheduled' | 'in_progress' | 'completed';
    notes?: string;
    created_at: string;
}

export interface MeetingIssue {
    id: string;
    meeting_id: string;
    title: string;
    description?: string;
    owner_id?: string;
    priority: 'low' | 'medium' | 'high';
    status: 'open' | 'solved';
    order_index: number;
    created_at: string;
}

export interface MeetingHeadline {
    id: string;
    meeting_id: string;
    title: string;
    type: 'customer' | 'employee' | 'personal';
    owner_id?: string;
    created_at: string;
}

export interface MeetingTodo {
    id: string;
    meeting_id?: string;
    title: string;
    owner_id?: string;
    completed: boolean;
    due_date?: string;
    created_at: string;
}

export interface Integration {
    id: string;
    provider: 'meta_ads' | 'google_ads';
    credentials: {
        access_token: string;
        ad_account_id: string;
    };
    status: 'active' | 'inactive' | 'error';
    created_at: string;
    updated_at: string;
}

export interface CachedInsight {
    id: string;
    platform: string;
    account_id: string;
    date_range: string;
    data: any;
    fetched_at: string;
}
