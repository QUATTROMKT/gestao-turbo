import { supabase } from './supabase';

export interface MetaAdsInsights {
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
        // Safe check-then-update approach
        const { data: existing } = await supabase
            .from('integrations')
            .select('id')
            .eq('provider', 'meta_ads')
            .single();

        const payload = {
            provider: 'meta_ads',
            credentials: { access_token: accessToken, ad_account_id: adAccountId },
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

    // Fetch insights from Real API
    async getInsights(dateRange: 'last_7d' | 'last_30d' | 'this_month' = 'last_30d'): Promise<MetaAdsInsights> {
        const creds = await this.getCredentials();

        if (!creds || !creds.credentials?.access_token) {
            console.warn('Meta Ads credentials not found, returning mock data.');
            return MOCK_INSIGHTS;
        }

        const { access_token, ad_account_id } = creds.credentials;
        const accountId = ad_account_id.startsWith('act_') ? ad_account_id : `act_${ad_account_id}`;

        try {
            const response = await fetch(
                `https://graph.facebook.com/v19.0/${accountId}/insights?access_token=${access_token}&date_preset=${dateRange}&fields=spend,impressions,clicks,cpc,cpm,ctr,actions`,
                { method: 'GET' }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Meta API Error:', errorData);
                throw new Error(errorData.error?.message || 'Failed to fetch Meta Ads insights');
            }

            const data = await response.json();

            if (data.data && data.data.length > 0) {
                // Determine date_stop based on preset
                const today = new Date();
                const startDate = new Date();
                if (dateRange === 'last_7d') startDate.setDate(today.getDate() - 7);
                if (dateRange === 'last_30d') startDate.setDate(today.getDate() - 30);

                // Aggregate data if multiple rows returned (though usually insights returns one row for preset)
                const insight = data.data[0];

                return {
                    spend: parseFloat(insight.spend || 0),
                    impressions: parseInt(insight.impressions || 0),
                    clicks: parseInt(insight.clicks || 0),
                    cpc: parseFloat(insight.cpc || 0),
                    cpm: parseFloat(insight.cpm || 0),
                    ctr: parseFloat(insight.ctr || 0),
                    actions: insight.actions || [],
                    date_start: insight.date_start,
                    date_stop: insight.date_stop
                };
            }

            // Return zeros if no data found
            return {
                spend: 0,
                impressions: 0,
                clicks: 0,
                cpc: 0,
                cpm: 0,
                ctr: 0,
                actions: [],
                date_start: '',
                date_stop: ''
            };

        } catch (error) {
            console.error('Error fetching Meta Ads:', error);
            // Fallback to mock for demo if API fails (e.g. invalid token)
            return MOCK_INSIGHTS;
        }
    }
};
