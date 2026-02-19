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
        const { data, error } = await supabase
            .from('integrations')
            .upsert({
                provider: 'clickup',
                credentials: { token: personalAccessToken },
                status: 'active',
                updated_at: new Date().toISOString()
            }, { onConflict: 'provider' })
            .select()
            .single();

        if (error) throw error;
        return data;
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

    async getTasks(): Promise<ClickUpTask[]> {
        const creds = await this.getCredentials();
        if (!creds) {
            return new Promise(resolve => setTimeout(() => resolve(MOCK_TASKS), 900));
        }

        // Real API: fetch('https://api.clickup.com/api/v2/team/xyz/task?include_closed=true')
        return new Promise(resolve => setTimeout(() => resolve(MOCK_TASKS), 1200));
    }
};
