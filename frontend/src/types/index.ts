export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  api_quota: number;
  quota_used: number;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  role: string;
  full_name?: string;
}

export interface NormalizedPhone {
  raw_input: string;
  e164_format: string;
  national_format: string;
  country_code: string;
  country_iso2: string;
  number_type: string;
  is_valid: boolean;
  carrier_name?: string;
  line_type?: string;
  timezones: string[];
}

export interface PreflightResult {
  total_detected: number;
  valid_count: number;
  invalid_count: number;
  duplicate_count: number;
  valid_samples: NormalizedPhone[];
  invalid_samples: string[];
}

export interface Investigation {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
  total_numbers: number;
  verified_matches: number;
  possible_matches: number;
  spam_count: number;
  business_count: number;
  failed_count: number;
  created_at: string;
  completed_at?: string;
}

export interface BulkJobProgress {
  id: string;
  investigation_id: string;
  total_records: number;
  processed_records: number;
  successful_records: number;
  failed_records: number;
  status: string;
  progress_percentage: number;
  error_log?: string;
}

export interface BulkResultTableItem {
  task_id: string;
  phone_number_id: string;
  raw_input: string;
  e164_format: string;
  country_iso2: string;
  country_code: string;
  number_type: string;
  is_valid: boolean;
  carrier_name?: string;
  carrier_circle?: string;
  public_name?: string;
  business_name?: string;
  avatar_url?: string;
  user_handle?: string;
  confidence_score: number;
  overall_status: string;
  whatsapp_status: string;
  telegram_status: string;
  social_profiles_count: number;
  spam_risk_level: string;
  task_status: string;
  created_at: string;
}

export interface PaginatedTableResponse {
  items: BulkResultTableItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface EvidenceRecord {
  id: string;
  source_url?: string;
  snippet?: string;
  evidence_type: string;
  retrieved_at: string;
}

export interface PublicProfile {
  id: string;
  profile_identifier: string;
  avatar_url?: string;
  bio?: string;
  public_contact_info?: Record<string, any>;
  has_verified_badge: boolean;
}

export interface PlatformResult {
  id: string;
  platform_name: string;
  verification_status: 'verified_association' | 'possible_public_match' | 'not_found' | 'not_publicly_verifiable' | 'api_unavailable' | 'search_failed';
  profile_url?: string;
  public_username?: string;
  public_display_name?: string;
  is_business: boolean;
  confidence_level: number;
  checked_at: string;
  evidence_records: EvidenceRecord[];
  public_profiles: PublicProfile[];
}

export interface SpamReport {
  id: string;
  spam_category: string;
  report_count: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  confidence_score: number;
  created_at: string;
}

export interface AIReport {
  id: string;
  model_used: string;
  key_findings?: Array<{ statement: string; source_attribution: string; confidence: number }>;
  conflicting_evidence?: Array<{ attribute: string; source_a: string; value_a: string; source_b: string; value_b: string; resolution_guidance: string }>;
  reliability_assessment?: string;
  missing_information?: string[];
  risk_summary?: string;
  created_at: string;
}

export interface PhotoSource {
  platform: string;
  url: string;
  label: string;
}

export interface FullNumberReportResponse {
  phone_number: string;
  e164_format: string;
  national_format?: string;
  country_iso2?: string;
  country_code?: string;
  number_type: string;
  is_valid: boolean;
  carrier_name?: string;
  carrier_circle?: string;
  line_type?: string;
  public_name?: string;
  business_name?: string;
  avatar_url?: string;
  user_handle?: string;
  bio?: string;
  location?: string;
  photo_sources?: PhotoSource[];
  web_snippets?: Array<{ title: string; snippet: string; url: string }>;
  free_osint_sources?: string[];
  confidence_score: number;
  overall_verification_status: string;
  summary?: string;
  platforms: PlatformResult[];
  spam_reports: SpamReport[];
  ai_report?: AIReport;
  task_id: string;
  task_status: string;
  created_at: string;
}

export interface SourceProvider {
  id: string;
  name: string;
  provider_type: string;
  base_url?: string;
  is_active: boolean;
  rate_limit_per_minute: number;
  daily_quota: number;
  current_day_requests: number;
  has_api_key: boolean;
}

export interface DashboardAnalytics {
  metrics: {
    total_numbers_processed: number;
    verified_public_matches: number;
    possible_profile_matches: number;
    spam_associated_numbers: number;
    business_numbers_identified: number;
    failed_lookups: number;
  };
  timeline: Array<{
    date: string;
    searches: number;
    verified: number;
    spam: number;
  }>;
  platforms: Array<{
    platform: string;
    verified: number;
    possible: number;
    unverified: number;
  }>;
  countries: Array<{
    country: string;
    code: string;
    count: number;
  }>;
  spam_distribution: Array<{
    category: string;
    count: number;
  }>;
}
