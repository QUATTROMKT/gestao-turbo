import { supabase } from './supabase';

interface MetaAdsInsights {
    spend: number;
    impressions: number;
    clicks: number;
    cpc: number;
    cpm: number;
    ctr: number;
    actions: any;
    date_start: string;
    date_stop: string;
}

// Mock data generator for MVP or when API is not configured
const MOCK_INSIGHTS: MetaAdsInsights = {
    spend: 1250.50,
    impressions: 45000,
    clicks: 850,
    cpc: 1.47,
    cpm: 27.78,
    ctr: 1.88,
    actions: [
        { action_type: 'lead', value: 45 },
        { action_type: 'purchase', value: 12 }
    ],
    date_start: '2023-10-01',
    date_stop: '2023-10-31'
};

export const MetaService = {
    // Save credentials to Supabase
    async saveCredentials(accessToken: string, adAccountId: string) {
        // Enforce RLS via Supabase (admin only)
        const { data, error } = await supabase
            .from('integrations')
            .upsert({
                provider: 'meta_ads',
                credentials: { access_token: accessToken, ad_account_id: adAccountId },
                status: 'active',
                updated_at: new Date().toISOString()
            }, { onConflict: 'provider' })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get credentials
    async getCredentials() {
        const { data, error } = await supabase
            .from('integrations')
            .select('*')
            .eq('provider', 'meta_ads')
            .single();

        if (error) return null;
        return data;
    },

    // Fetch insights (Mocked for now, but structured for real API)
    async getInsights(dateRange: 'last_7d' | 'last_30d' | 'this_month' = 'last_30d'): Promise<MetaAdsInsights> {
        // 1. Try to get real credentials
        const creds = await this.getCredentials();

        if (!creds || !creds.credentials?.access_token) {
            console.warn('Meta Ads credentials not found, returning mock data.');
            return new Promise(resolve => setTimeout(() => resolve(MOCK_INSIGHTS), 1000));
        }

        const { access_token, ad_account_id } = creds.credentials;

        // 2. Real API call would go here
        // const url = `https://graph.facebook.com/v18.0/${ad_account_id}/insights?access_token=${access_token}&date_preset=${dateRange}&fields=spend,impressions,clicks,cpc,cpm,ctr,actions`;

        // For MVP, we simulate API call success with mock data
        console.log(`Fetching Meta Ads for ${ad_account_id} with token ${access_token?.substring(0, 5)}...`);
        return new Promise(resolve => setTimeout(() => resolve(MOCK_INSIGHTS), 1500));
    }
};
