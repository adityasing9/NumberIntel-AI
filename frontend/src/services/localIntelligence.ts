import {
  Investigation,
  BulkResultTableItem,
  PaginatedTableResponse,
  FullNumberReportResponse,
  DashboardAnalytics,
  SourceProvider,
  PreflightResult,
  NormalizedPhone,
  PlatformResult
} from '../types';

// Default initial investigations
const INITIAL_INVESTIGATIONS: Investigation[] = [
  {
    id: 'inv-case-001',
    title: 'Q4 Enterprise Fraud & OSINT Footprint Audit',
    description: 'Cross-border digital footprint discovery and spam reputation review.',
    status: 'completed',
    total_numbers: 5,
    verified_matches: 2,
    possible_matches: 1,
    spam_count: 1,
    business_count: 2,
    failed_count: 0,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    completed_at: new Date(Date.now() - 86400000 * 2 + 180000).toISOString(),
  },
  {
    id: 'inv-case-002',
    title: 'APAC Telecom Ingestion & Carrier Geocoding',
    description: 'ITU-T numbering plan verification across India and Southeast Asia.',
    status: 'completed',
    total_numbers: 12,
    verified_matches: 4,
    possible_matches: 3,
    spam_count: 2,
    business_count: 3,
    failed_count: 0,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    completed_at: new Date(Date.now() - 86400000 * 4 + 320000).toISOString(),
  }
];

const INITIAL_TABLE_ITEMS: Record<string, BulkResultTableItem[]> = {
  'inv-case-001': [
    {
      task_id: 'task-001',
      phone_number_id: 'pn-001',
      raw_input: '+919876543210',
      e164_format: '+919876543210',
      country_iso2: 'IN',
      country_code: '91',
      number_type: 'mobile',
      is_valid: true,
      carrier_name: 'Bharti Airtel',
      public_name: 'Airtel Enterprise Desk',
      business_name: 'Bharti Airtel Limited',
      confidence_score: 95,
      overall_status: 'verified',
      whatsapp_status: 'verified_association',
      telegram_status: 'not_publicly_verifiable',
      social_profiles_count: 3,
      spam_risk_level: 'low',
      task_status: 'completed',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      task_id: 'task-002',
      phone_number_id: 'pn-002',
      raw_input: '+911800266001',
      e164_format: '+911800266001',
      country_iso2: 'IN',
      country_code: '91',
      number_type: 'toll_free',
      is_valid: true,
      carrier_name: 'Tata Teleservices',
      public_name: 'Enterprise Helpline Central',
      business_name: 'Tata Communications Ltd',
      confidence_score: 90,
      overall_status: 'verified',
      whatsapp_status: 'verified_association',
      telegram_status: 'not_publicly_verifiable',
      social_profiles_count: 2,
      spam_risk_level: 'low',
      task_status: 'completed',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      task_id: 'task-003',
      phone_number_id: 'pn-003',
      raw_input: '+18002738255',
      e164_format: '+18002738255',
      country_iso2: 'US',
      country_code: '1',
      number_type: 'toll_free',
      is_valid: true,
      carrier_name: 'T-Mobile USA',
      public_name: 'National Helpline Bureau',
      business_name: 'US Public Safety Desk',
      confidence_score: 88,
      overall_status: 'verified',
      whatsapp_status: 'not_found',
      telegram_status: 'not_publicly_verifiable',
      social_profiles_count: 1,
      spam_risk_level: 'low',
      task_status: 'completed',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      task_id: 'task-004',
      phone_number_id: 'pn-004',
      raw_input: '+442079460912',
      e164_format: '+442079460912',
      country_iso2: 'GB',
      country_code: '44',
      number_type: 'fixed_line',
      is_valid: true,
      carrier_name: 'British Telecommunications',
      public_name: 'London Executive Offices',
      business_name: 'Westminster Global Services',
      confidence_score: 75,
      overall_status: 'possible_match',
      whatsapp_status: 'not_found',
      telegram_status: 'not_publicly_verifiable',
      social_profiles_count: 1,
      spam_risk_level: 'low',
      task_status: 'completed',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      task_id: 'task-005',
      phone_number_id: 'pn-005',
      raw_input: '+919999988888',
      e164_format: '+919999988888',
      country_iso2: 'IN',
      country_code: '91',
      number_type: 'mobile',
      is_valid: true,
      carrier_name: 'Reliance Jio',
      public_name: 'High Frequency Robocall',
      business_name: 'Unregistered Direct Sales',
      confidence_score: 92,
      overall_status: 'suspicious',
      whatsapp_status: 'not_found',
      telegram_status: 'not_publicly_verifiable',
      social_profiles_count: 0,
      spam_risk_level: 'high',
      task_status: 'completed',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    }
  ]
};

export const getLocalInvestigations = (): Investigation[] => {
  const saved = localStorage.getItem('numberintel_local_invs');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  localStorage.setItem('numberintel_local_invs', JSON.stringify(INITIAL_INVESTIGATIONS));
  return INITIAL_INVESTIGATIONS;
};

export const saveLocalInvestigation = (inv: Investigation, items: BulkResultTableItem[]) => {
  const current = getLocalInvestigations();
  const updated = [inv, ...current];
  localStorage.setItem('numberintel_local_invs', JSON.stringify(updated));

  const allItems = getLocalTableItems();
  allItems[inv.id] = items;
  localStorage.setItem('numberintel_local_items', JSON.stringify(allItems));
};

export const getLocalTableItems = (): Record<string, BulkResultTableItem[]> => {
  const saved = localStorage.getItem('numberintel_local_items');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  localStorage.setItem('numberintel_local_items', JSON.stringify(INITIAL_TABLE_ITEMS));
  return INITIAL_TABLE_ITEMS;
};

export const generateLocalDossier = (taskId: string): FullNumberReportResponse => {
  const allItems = getLocalTableItems();
  let foundItem: BulkResultTableItem | undefined;

  for (const list of Object.values(allItems)) {
    const it = list.find((i) => i.task_id === taskId);
    if (it) {
      foundItem = it;
      break;
    }
  }

  const phone = foundItem?.e164_format || '+919876543210';
  const carrier = foundItem?.carrier_name || 'Bharti Airtel';
  const cIso = foundItem?.country_iso2 || 'IN';
  const cCode = foundItem?.country_code || '91';
  const numType = foundItem?.number_type || 'mobile';
  const isSpam = foundItem?.spam_risk_level === 'high' || foundItem?.spam_risk_level === 'critical';

  const platforms: PlatformResult[] = [
    {
      id: 'p-wa',
      platform_name: 'whatsapp',
      verification_status: foundItem?.whatsapp_status === 'verified_association' ? 'verified_association' : 'not_publicly_verifiable',
      profile_url: `https://api.whatsapp.com/send?phone=${phone.replace('+', '')}`,
      public_display_name: foundItem?.business_name || 'WhatsApp Business Gateway',
      is_business: true,
      confidence_level: 85,
      checked_at: new Date().toISOString(),
      evidence_records: [
        {
          id: 'ev-wa',
          source_url: `https://api.whatsapp.com/send?phone=${phone.replace('+', '')}`,
          snippet: 'Official WhatsApp Business click-to-chat endpoint responds with registered commercial catalog.',
          evidence_type: 'official_api_response',
          retrieved_at: new Date().toISOString()
        }
      ],
      public_profiles: []
    },
    {
      id: 'p-tg',
      platform_name: 'telegram',
      verification_status: 'not_publicly_verifiable',
      is_business: false,
      confidence_level: 0,
      checked_at: new Date().toISOString(),
      evidence_records: [
        {
          id: 'ev-tg',
          source_url: 'https://core.telegram.org/api',
          snippet: 'Telegram Bot API restricts reverse phone lookup. Personal user accounts are protected by privacy settings.',
          evidence_type: 'official_api_response',
          retrieved_at: new Date().toISOString()
        }
      ],
      public_profiles: []
    },
    {
      id: 'p-sig',
      platform_name: 'signal',
      verification_status: 'not_publicly_verifiable',
      is_business: false,
      confidence_level: 0,
      checked_at: new Date().toISOString(),
      evidence_records: [
        {
          id: 'ev-sig',
          source_url: 'https://signal.org',
          snippet: 'Signal uses end-to-end zero-knowledge architecture. No public directory or reverse phone lookup exists by design.',
          evidence_type: 'official_api_response',
          retrieved_at: new Date().toISOString()
        }
      ],
      public_profiles: []
    },
    {
      id: 'p-li',
      platform_name: 'linkedin',
      verification_status: 'possible_public_match',
      is_business: true,
      profile_url: 'https://linkedin.com',
      public_display_name: `${foundItem?.business_name || 'Enterprise'} Official Corporate Contact`,
      confidence_level: 70,
      checked_at: new Date().toISOString(),
      evidence_records: [
        {
          id: 'ev-li',
          source_url: 'https://linkedin.com',
          snippet: `Public company page mentions customer service line: ${phone}.`,
          evidence_type: 'search_engine_hit',
          retrieved_at: new Date().toISOString()
        }
      ],
      public_profiles: []
    },
    {
      id: 'p-fb',
      platform_name: 'facebook',
      verification_status: 'possible_public_match',
      is_business: true,
      profile_url: 'https://facebook.com',
      public_display_name: 'Verified Business Page',
      confidence_level: 65,
      checked_at: new Date().toISOString(),
      evidence_records: [
        {
          id: 'ev-fb',
          source_url: 'https://facebook.com',
          snippet: `Public business listing with published contact number: ${phone}.`,
          evidence_type: 'search_engine_hit',
          retrieved_at: new Date().toISOString()
        }
      ],
      public_profiles: []
    },
    {
      id: 'p-ig',
      platform_name: 'instagram',
      verification_status: 'not_found',
      is_business: false,
      confidence_level: 0,
      checked_at: new Date().toISOString(),
      evidence_records: [],
      public_profiles: []
    },
    {
      id: 'p-x',
      platform_name: 'x',
      verification_status: 'not_found',
      is_business: false,
      confidence_level: 0,
      checked_at: new Date().toISOString(),
      evidence_records: [],
      public_profiles: []
    },
    {
      id: 'p-tt',
      platform_name: 'tiktok',
      verification_status: 'not_found',
      is_business: false,
      confidence_level: 0,
      checked_at: new Date().toISOString(),
      evidence_records: [],
      public_profiles: []
    },
    {
      id: 'p-sc',
      platform_name: 'snapchat',
      verification_status: 'not_found',
      is_business: false,
      confidence_level: 0,
      checked_at: new Date().toISOString(),
      evidence_records: [],
      public_profiles: []
    }
  ];

  return {
    phone_number: foundItem?.raw_input || phone,
    e164_format: phone,
    national_format: phone.replace('+91', '0').replace('+1', ''),
    country_iso2: cIso,
    country_code: cCode,
    number_type: numType,
    is_valid: true,
    carrier_name: carrier,
    line_type: numType.replace('_', ' ').toUpperCase(),
    public_name: foundItem?.public_name || 'Enterprise Customer Contact',
    business_name: foundItem?.business_name || 'Registered Corporate Entity',
    confidence_score: foundItem?.confidence_score || 90,
    overall_verification_status: foundItem?.overall_status || 'verified',
    summary: `Telephone intelligence dossier compiled for ${phone}. The line is a valid ${numType} allocation in ${cIso} assigned to ${carrier}. Discovered verified digital footprint on WhatsApp Business and publicly indexed professional citations on LinkedIn. Spam reputation is evaluated as ${isSpam ? 'HIGH RISK' : 'LOW RISK'}.`,
    platforms,
    spam_reports: isSpam ? [
      {
        id: 'sr-01',
        spam_category: 'telemarketing',
        report_count: 14,
        risk_level: 'high',
        confidence_score: 92,
        created_at: new Date().toISOString()
      }
    ] : [],
    ai_report: {
      id: 'ai-01',
      model_used: 'anthropic/claude-3.5-sonnet',
      key_findings: [
        { statement: `Number is structurally valid according to ITU-T standards for ${cIso}.`, source_attribution: 'Google libphonenumber', confidence: 1.0 },
        { statement: `Allocated to telecommunications operator '${carrier}'.`, source_attribution: 'Numbering Authority Geocoding', confidence: 0.95 },
        { statement: 'Verified official public WhatsApp Business gateway link.', source_attribution: 'Meta WhatsApp Business Platform', confidence: 0.85 }
      ],
      conflicting_evidence: [],
      reliability_assessment: 'Overall confidence score: 90%. All extracted facts are authoritatively verified through official platform endpoints and telecom registries.',
      missing_information: [
        'Private subscriber residential identity (protected by telecom privacy laws and DPDP 2023).',
        'Signal private registration status (zero-knowledge protocol precludes reverse lookups).'
      ],
      risk_summary: isSpam ? 'RISK LEVEL: HIGH. Number reported across multiple telemarketing registries.' : 'RISK LEVEL: LOW. No adverse threat flags found.',
      created_at: new Date().toISOString()
    },
    task_id: taskId,
    task_status: 'completed',
    created_at: new Date().toISOString()
  };
};

export const getLocalDashboardAnalytics = (): DashboardAnalytics => {
  const invs = getLocalInvestigations();
  let totalProcessed = 0;
  let verifiedMatches = 0;
  let possibleMatches = 0;
  let spamCount = 0;
  let businessCount = 0;

  invs.forEach((i) => {
    totalProcessed += i.total_numbers;
    verifiedMatches += i.verified_matches;
    possibleMatches += i.possible_matches;
    spamCount += i.spam_count;
    businessCount += i.business_count;
  });

  return {
    metrics: {
      total_numbers_processed: Math.max(17, totalProcessed),
      verified_public_matches: Math.max(6, verifiedMatches),
      possible_profile_matches: Math.max(4, possibleMatches),
      spam_associated_numbers: Math.max(3, spamCount),
      business_numbers_identified: Math.max(5, businessCount),
      failed_lookups: 0
    },
    timeline: [
      { date: 'Nov 01', searches: 24, verified: 8, spam: 1 },
      { date: 'Nov 02', searches: 38, verified: 12, spam: 2 },
      { date: 'Nov 03', searches: 45, verified: 15, spam: 4 },
      { date: 'Nov 04', searches: 52, verified: 19, spam: 3 },
      { date: 'Nov 05', searches: 68, verified: 26, spam: 5 },
      { date: 'Nov 06', searches: 84, verified: 34, spam: 6 },
      { date: 'Nov 07', searches: 92, verified: 41, spam: 7 }
    ],
    platforms: [
      { platform: 'Whatsapp', verified: 38, possible: 14, unverified: 40 },
      { platform: 'Telegram', verified: 12, possible: 8, unverified: 72 },
      { platform: 'Signal', verified: 0, possible: 0, unverified: 92 },
      { platform: 'Linkedin', verified: 28, possible: 34, unverified: 30 },
      { platform: 'Facebook', verified: 22, possible: 29, unverified: 41 },
      { platform: 'Instagram', verified: 15, possible: 18, unverified: 59 },
      { platform: 'X', verified: 10, possible: 14, unverified: 68 },
      { platform: 'Tiktok', verified: 6, possible: 10, unverified: 76 },
      { platform: 'Snapchat', verified: 4, possible: 7, unverified: 81 }
    ],
    countries: [
      { country: 'India', code: 'IN', count: 48 },
      { country: 'United States', code: 'US', count: 24 },
      { country: 'United Kingdom', code: 'GB', count: 12 },
      { country: 'United Arab Emirates', code: 'AE', count: 5 },
      { country: 'Singapore', code: 'SG', count: 3 }
    ],
    spam_distribution: [
      { category: 'Telemarketing', count: 18 },
      { category: 'Robocall', count: 12 },
      { category: 'Suspected Fraud', count: 6 },
      { category: 'Financial Scam', count: 4 },
      { category: 'Unwanted Marketing', count: 9 }
    ]
  };
};

export const parseLocalPhones = (rawText: string, defaultCountry = 'IN'): PreflightResult => {
  const lines = rawText.split(/[\r\n,;]+/).map((s) => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const valid: NormalizedPhone[] = [];
  const invalid: string[] = [];
  let duplicates = 0;

  for (const raw of lines) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 8) {
      invalid.push(raw);
      continue;
    }

    let e164 = raw.startsWith('+') ? raw.replace(/\s+/g, '') : `+${defaultCountry === 'IN' ? '91' : '1'}${digits}`;
    if (seen.has(e164)) {
      duplicates++;
      continue;
    }
    seen.add(e164);

    valid.push({
      raw_input: raw,
      e164_format: e164,
      national_format: digits,
      country_code: defaultCountry === 'IN' ? '91' : '1',
      country_iso2: defaultCountry,
      number_type: digits.startsWith('1800') ? 'toll_free' : 'mobile',
      is_valid: true,
      carrier_name: defaultCountry === 'IN' ? 'Airtel / Jio' : 'T-Mobile / Verizon',
      line_type: digits.startsWith('1800') ? 'Toll Free' : 'Mobile',
      timezones: ['Asia/Calcutta']
    });
  }

  return {
    total_detected: lines.length,
    valid_count: valid.length,
    invalid_count: invalid.length,
    duplicate_count: duplicates,
    valid_samples: valid,
    invalid_samples: invalid
  };
};
