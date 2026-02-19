import { supabase } from './supabase';

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink: string;
    iconLink?: string;
}

const MOCK_FILES: DriveFile[] = [
    { id: '1', name: 'Contrato Social.pdf', mimeType: 'application/pdf', webViewLink: '#', iconLink: '' },
    { id: '2', name: 'Logo.png', mimeType: 'image/png', webViewLink: '#', iconLink: '' },
    { id: '3', name: 'Briefing Inicial.docx', mimeType: 'application/vnd.google-apps.document', webViewLink: '#', iconLink: '' }
];

export const GoogleDriveService = {
    async saveCredentials(clientId: string, clientSecret: string, apiKey: string) {
        const { data, error } = await supabase
            .from('integrations')
            .upsert({
                provider: 'google_drive',
                credentials: { client_id: clientId, client_secret: clientSecret, api_key: apiKey },
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
            .eq('provider', 'google_drive')
            .single();

        if (error) return null;
        return data;
    },

    async listFiles(folderId?: string): Promise<DriveFile[]> {
        const creds = await this.getCredentials();
        if (!creds) {
            console.warn('Google Drive credentials not found, returning mock data.');
            return new Promise(resolve => setTimeout(() => resolve(MOCK_FILES), 1000));
        }

        // Real API implementation would go here using fetch('https://www.googleapis.com/drive/v3/files?q=...')
        console.log('Fetching Google Drive files...');
        return new Promise(resolve => setTimeout(() => resolve(MOCK_FILES), 1500));
    }
};
