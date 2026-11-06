import axios from 'axios';
import { resolveCarrier } from './localIntelligence';

export interface FreeOsintResult {
  phone: string;
  cleanDigits: string;
  countryIso2: string;
  name?: string;
  businessName?: string;
  carrier?: string;
  circle?: string;
  location?: string;
  isBusiness: boolean;
  avatarUrl?: string;
  photoSources: Array<{ platform: string; url: string; label: string }>;
  spamScore: number;
  spamRiskLevel: 'low' | 'medium' | 'high';
  spamReportsCount: number;
  spamCategories: string[];
  socialProfiles: Array<{ platform: string; url: string; title: string; type: string }>;
  webSnippets: Array<{ title: string; snippet: string; url: string }>;
  sources: string[];
  summary: string;
}

export const freeOsintService = {
  lookup: async (phone: string, countryCode = 'IN'): Promise<FreeOsintResult | null> => {
    const cleanDigits = phone.replace(/\D/g, '');
    const tenDigits = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
    const country = countryCode.toUpperCase();
    const dialingCode = country === 'IN' ? '91' : country === 'US' ? '1' : country === 'GB' ? '44' : '91';
    const e164 = `+${dialingCode}${tenDigits}`;

    // 1. Try Vercel Serverless Function `/api/free-osint`
    try {
      const resp = await axios.get('/api/free-osint', {
        params: { phone: e164, countryCode: country },
        timeout: 9000,
      });

      if (resp.data && resp.data.success && resp.data.data) {
        const d = resp.data.data;
        return {
          phone: d.phone || e164,
          cleanDigits: d.clean_digits || tenDigits,
          countryIso2: d.country_iso2 || country,
          name: d.name || undefined,
          businessName: d.business_name || undefined,
          carrier: d.carrier || undefined,
          circle: d.circle || undefined,
          location: d.location || d.circle || undefined,
          isBusiness: !!d.is_business,
          avatarUrl: d.avatar_url || undefined,
          photoSources: d.photo_sources || [],
          spamScore: d.spam_score || 0,
          spamRiskLevel: d.spam_risk_level || 'low',
          spamReportsCount: d.spam_reports_count || 0,
          spamCategories: d.spam_categories || [],
          socialProfiles: d.social_profiles || [],
          webSnippets: d.web_snippets || [],
          sources: d.sources || ['Open Web Search Index'],
          summary: d.summary || '',
        };
      }
    } catch (err) {
      // Serverless API might be unreachable during local-only dev or cold start
    }

    // 2. Client-side Fallback using TRAI allocation + Direct Links
    const carrierInfo = resolveCarrier(e164, country);
    return {
      phone: e164,
      cleanDigits: tenDigits,
      countryIso2: country,
      name: undefined,
      businessName: undefined,
      carrier: carrierInfo.carrier,
      circle: carrierInfo.circle,
      location: carrierInfo.circle,
      isBusiness: false,
      avatarUrl: undefined,
      photoSources: [],
      spamScore: 1,
      spamRiskLevel: 'low',
      spamReportsCount: 0,
      spamCategories: [],
      socialProfiles: [
        {
          platform: 'WhatsApp',
          url: `https://wa.me/${dialingCode}${tenDigits}`,
          title: 'WhatsApp Direct Chat / Presence',
          type: 'Direct Communication Channel'
        },
        {
          platform: 'Truecaller Web',
          url: `https://www.truecaller.com/search/${country.toLowerCase()}/${tenDigits}`,
          title: 'Truecaller Web Directory Lookup',
          type: 'Caller Directory Registry'
        },
        {
          platform: 'Google Search',
          url: `https://www.google.com/search?q=%22${encodeURIComponent(tenDigits)}%22`,
          title: 'Google Exact Match Dork',
          type: 'Web Search Engine Index'
        }
      ],
      webSnippets: [],
      sources: ['National Telecom Numbering Plan', 'TRAI / DoT Carrier Grid'],
      summary: `Telecom subscriber allocated to ${carrierInfo.carrier} in ${carrierInfo.circle}.`
    };
  }
};
