import axios from 'axios';

export interface TruecallerSearchResult {
  found: boolean;
  name: string;
  carrier?: string;
  phoneType?: string;
  imageUrl?: string;
  city?: string;
  country?: string;
  email?: string;
  spamScore: number;
  spamType?: string;
  isBusiness: boolean;
  badges: string[];
  raw?: any;
}

const STORAGE_KEY = 'numberintel_truecaller_token';
const PHONE_STORAGE_KEY = 'numberintel_truecaller_phone';

export const truecallerService = {
  getToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEY);
  },

  getPhone: (): string | null => {
    return localStorage.getItem(PHONE_STORAGE_KEY);
  },

  setToken: (token: string, phone?: string): void => {
    localStorage.setItem(STORAGE_KEY, token.trim());
    if (phone) localStorage.setItem(PHONE_STORAGE_KEY, phone.trim());
  },

  clearToken: (): void => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PHONE_STORAGE_KEY);
  },

  sendOtp: async (phoneNumber: string, countryCode = 'IN', dialingCode = '91'): Promise<{ requestId: string; message: string }> => {
    const cleanDigits = phoneNumber.replace(/\D/g, '').slice(-10);

    // Try serverless endpoint first, then direct backend
    const endpoints = [
      '/api/truecaller?action=send-otp',
      '/api/v1/truecaller/send-otp'
    ];

    let lastError: any = null;
    for (const url of endpoints) {
      try {
        const res = await axios.post(url, {
          phoneNumber: cleanDigits,
          phone_number: cleanDigits,
          countryCode,
          country_code: countryCode,
          dialingCode
        }, { timeout: 15000 });

        const data = res.data;
        const requestId = data.requestId || data.request_id || data.data?.requestId;
        if (requestId) {
          return {
            requestId,
            message: 'OTP has been dispatched via SMS to your telephone number.'
          };
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    throw new Error(lastError?.response?.data?.message || lastError?.response?.data?.detail || 'Failed to dispatch Truecaller SMS OTP. Please verify number.');
  },

  verifyOtp: async (phoneNumber: string, requestId: string, otp: string, countryCode = 'IN', dialingCode = '91'): Promise<{ installationId: string }> => {
    const cleanDigits = phoneNumber.replace(/\D/g, '').slice(-10);

    const endpoints = [
      '/api/truecaller?action=verify-otp',
      '/api/v1/truecaller/verify-otp'
    ];

    let lastError: any = null;
    for (const url of endpoints) {
      try {
        const res = await axios.post(url, {
          phoneNumber: cleanDigits,
          phone_number: cleanDigits,
          requestId,
          request_id: requestId,
          otp: otp.trim(),
          token: otp.trim(),
          countryCode,
          country_code: countryCode,
          dialingCode
        }, { timeout: 15000 });

        const data = res.data;
        const installationId = data.installationId || data.installation_id || data.data?.installationId;
        if (installationId) {
          truecallerService.setToken(installationId, phoneNumber);
          return { installationId };
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    throw new Error(lastError?.response?.data?.message || lastError?.response?.data?.detail || 'Invalid or expired OTP. Verification failed.');
  },

  search: async (phoneNumber: string, countryCode = '91', overrideToken?: string): Promise<TruecallerSearchResult | null> => {
    const token = overrideToken || truecallerService.getToken();
    if (!token) {
      return null;
    }

    const cleanDigits = phoneNumber.replace(/\D/g, '').slice(-10);
    const endpoints = [
      `/api/truecaller?phone=${cleanDigits}&countryCode=${countryCode}`,
      `/api/v1/truecaller/search`
    ];

    for (const url of endpoints) {
      try {
        const isV1 = url.includes('/v1/');
        const res = isV1
          ? await axios.post(url, {
              phone_number: cleanDigits,
              country_code: 'IN',
              installation_id: token
            }, { timeout: 12000 })
          : await axios.get(url, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 12000
            });

        const data = res.data;
        // Check if records returned
        const record = data.raw || (data.data && data.data[0]) || (Array.isArray(data) && data[0]);
        if (!record && !data.name) {
          continue;
        }

        const name = data.name || record?.name;
        if (!name) continue;

        const phones = record?.phones || [];
        const carrier = data.carrier || phones[0]?.carrier;
        const phoneType = data.phone_type || phones[0]?.numberType;

        const addresses = record?.addresses || [];
        const city = data.city || addresses[0]?.city;
        const country = data.country || addresses[0]?.countryCode;

        const emails = [record?.internetAddresses?.[0]?.id].filter(Boolean);
        const email = data.email || emails[0];

        const imageUrl = data.image_url || record?.image;
        const badges = data.badges || record?.badges || [];
        const spamScore = data.spam_score || record?.spamScore || 0;
        const spamType = data.spam_type || record?.spamType;
        const isBusiness = data.is_business || badges.includes('business') || !!record?.isBusiness;

        return {
          found: true,
          name,
          carrier,
          phoneType,
          imageUrl,
          city,
          country,
          email,
          spamScore,
          spamType,
          isBusiness,
          badges,
          raw: record
        };
      } catch (err: any) {
        // If 401 token expired
        if (err.response?.status === 401) {
          console.warn('Truecaller token expired.');
        }
      }
    }

    return null;
  }
};
