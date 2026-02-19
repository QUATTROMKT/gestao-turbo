import { supabase } from './supabase';

export interface NotionPage {
    id: string;
    title: string;
    url: string;
    last_edited: string;
}

const MOCK_PAGES: NotionPage[] = [
    { id: '1', title: 'Empresa Wiki', url: 'https://notion.so/wiki', last_edited: '2023-10-25' },
    { id: '2', title: 'Roadmap Q4', url: 'https://notion.so/roadmap', last_edited: '2023-10-28' },
];

export const NotionService = {
    async saveCredentials(integrationToken: string) {
        const { data, error } = await supabase
            .from('integrations')
            .upsert({
                provider: 'notion',
                credentials: { token: integrationToken },
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
            .eq('provider', 'notion')
            .single();

        if (error) return null;
        return data;
    },

    async searchPages(query: string = ''): Promise<NotionPage[]> {
        const creds = await this.getCredentials();
        if (!creds) {
            return new Promise(resolve => setTimeout(() => resolve(MOCK_PAGES), 800));
        }

        // Real API: fetch('https://api.notion.com/v1/search', ...)
        return new Promise(resolve => setTimeout(() => resolve(MOCK_PAGES), 1000));
    }
};
