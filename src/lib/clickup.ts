import { supabase } from './supabase';

export interface ClickUpTask {
    id: string;
    name: string;
    status: string;
    assignees: string[];
    url: string;
}

const MOCK_TASKS: ClickUpTask[] = [
    { id: '1', name: 'Criar Landing Page Black Friday', status: 'in_progress', assignees: ['Kadu'], url: '#' },
    { id: '2', name: 'Revisar Copy Email Marketing', status: 'review', assignees: ['Kadu'], url: '#' },
];

export const ClickUpService = {
    async saveCredentials(personalAccessToken: string) {
        const { data: existing } = await supabase
            .from('integrations')
            .select('id')
            .eq('provider', 'clickup')
            .single();

        const payload = {
            provider: 'clickup',
            credentials: { token: personalAccessToken },
            status: 'active',
            updated_at: new Date().toISOString()
        };

        if (existing) {
            const { data, error } = await supabase
                .from('integrations')
                .update(payload)
                .eq('id', existing.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabase
                .from('integrations')
                .insert(payload)
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    },

    async getCredentials() {
        const { data, error } = await supabase
            .from('integrations')
            .select('*')
            .eq('provider', 'clickup')
            .single();

        if (error) return null;
        return data;
    },

    // Fetch tasks from Real API
    async getTasks(): Promise<ClickUpTask[]> {
        const creds = await this.getCredentials();

        if (!creds || !creds.credentials?.token) {
            console.warn('ClickUp credentials not found, returning mock data.');
            return [];
        }

        const token = creds.credentials.token;

        try {
            // 1. Get Teams (Workspaces)
            const teamRes = await fetch('https://api.clickup.com/api/v2/team', {
                headers: { Authorization: token }
            });

            if (!teamRes.ok) throw new Error('Failed to fetch ClickUp teams');
            const teamData = await teamRes.json();
            const teamId = teamData.teams?.[0]?.id;

            if (!teamId) return [];

            // 2. Get User ID
            const userRes = await fetch('https://api.clickup.com/api/v2/user', {
                headers: { Authorization: token }
            });
            const userData = await userRes.json();
            const clickupUserId = userData.user?.id;

            // 3. Get Tasks
            const tasksRes = await fetch(
                `https://api.clickup.com/api/v2/team/${teamId}/task?page=0&include_closed=false&assignees[]=${clickupUserId}`,
                { headers: { Authorization: token } }
            );

            if (!tasksRes.ok) throw new Error('Failed to fetch ClickUp tasks');
            const tasksData = await tasksRes.json();

            if (!tasksData.tasks) return [];

            return tasksData.tasks.map((t: any) => ({
                id: t.id,
                name: t.name,
                status: t.status?.status,
                assignees: t.assignees?.map((a: any) => a.username) || [],
                url: t.url
            }));

        } catch (error) {
            console.error('Error fetching ClickUp tasks:', error);
            // Fallback to empty if error (to avoid breaking UI)
            return [];
        }
    }
};
