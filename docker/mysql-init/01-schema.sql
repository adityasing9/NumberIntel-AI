-- NumberIntel AI: MySQL 8.0+ Enterprise Schema
-- Normalized relational schema (17 tables)

CREATE DATABASE IF NOT EXISTS numberintel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE numberintel;

-- 1. roles
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    permissions JSON NULL,
    description VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. users
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    role_id INT NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    api_quota INT DEFAULT 10000,
    quota_used INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    INDEX idx_users_email (email),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. investigations
CREATE TABLE IF NOT EXISTS investigations (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    total_numbers INT DEFAULT 0,
    verified_matches INT DEFAULT 0,
    possible_matches INT DEFAULT 0,
    spam_count INT DEFAULT 0,
    business_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    INDEX idx_investigations_user (user_id),
    INDEX idx_investigations_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. phone_numbers
CREATE TABLE IF NOT EXISTS phone_numbers (
    id CHAR(36) PRIMARY KEY,
    raw_input VARCHAR(50) NOT NULL,
    e164_format VARCHAR(30) NOT NULL UNIQUE,
    national_format VARCHAR(50) NULL,
    country_code VARCHAR(10) NULL,
    country_iso2 VARCHAR(5) NULL,
    number_type VARCHAR(50) DEFAULT 'unknown',
    is_valid BOOLEAN DEFAULT FALSE,
    carrier_name VARCHAR(150) NULL,
    line_type VARCHAR(50) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone_e164 (e164_format),
    INDEX idx_phone_country (country_iso2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. bulk_jobs
CREATE TABLE IF NOT EXISTS bulk_jobs (
    id CHAR(36) PRIMARY KEY,
    investigation_id CHAR(36) NOT NULL,
    total_records INT DEFAULT 0,
    processed_records INT DEFAULT 0,
    successful_records INT DEFAULT 0,
    failed_records INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    error_log TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bulk_investigation (investigation_id),
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. lookup_tasks
CREATE TABLE IF NOT EXISTS lookup_tasks (
    id CHAR(36) PRIMARY KEY,
    bulk_job_id CHAR(36) NOT NULL,
    phone_number_id CHAR(36) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    scheduled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    error_message TEXT NULL,
    INDEX idx_tasks_bulk (bulk_job_id),
    INDEX idx_tasks_phone (phone_number_id),
    INDEX idx_tasks_status (status),
    FOREIGN KEY (bulk_job_id) REFERENCES bulk_jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (phone_number_id) REFERENCES phone_numbers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. intelligence_results
CREATE TABLE IF NOT EXISTS intelligence_results (
    id CHAR(36) PRIMARY KEY,
    lookup_task_id CHAR(36) NOT NULL UNIQUE,
    public_name VARCHAR(255) NULL,
    business_name VARCHAR(255) NULL,
    confidence_score FLOAT DEFAULT 0.0,
    overall_verification_status VARCHAR(50) DEFAULT 'unverified',
    summary TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_intel_task (lookup_task_id),
    FOREIGN KEY (lookup_task_id) REFERENCES lookup_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. platform_results
CREATE TABLE IF NOT EXISTS platform_results (
    id CHAR(36) PRIMARY KEY,
    intelligence_result_id CHAR(36) NOT NULL,
    platform_name VARCHAR(50) NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'not_found',
    profile_url VARCHAR(500) NULL,
    public_username VARCHAR(150) NULL,
    public_display_name VARCHAR(255) NULL,
    is_business BOOLEAN DEFAULT FALSE,
    confidence_level FLOAT DEFAULT 0.0,
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_platform_intel (intelligence_result_id),
    INDEX idx_platform_name (platform_name),
    FOREIGN KEY (intelligence_result_id) REFERENCES intelligence_results(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. public_profiles
CREATE TABLE IF NOT EXISTS public_profiles (
    id CHAR(36) PRIMARY KEY,
    platform_result_id CHAR(36) NOT NULL,
    profile_identifier VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500) NULL,
    bio TEXT NULL,
    public_contact_info JSON NULL,
    has_verified_badge BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_profile_platform (platform_result_id),
    FOREIGN KEY (platform_result_id) REFERENCES platform_results(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. source_providers
CREATE TABLE IF NOT EXISTS source_providers (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    provider_type VARCHAR(50) NOT NULL,
    base_url VARCHAR(255) NULL,
    api_key_encrypted TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    rate_limit_per_minute INT DEFAULT 60,
    daily_quota INT DEFAULT 10000,
    current_day_requests INT DEFAULT 0,
    timeout_seconds INT DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_provider_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. evidence_records
CREATE TABLE IF NOT EXISTS evidence_records (
    id CHAR(36) PRIMARY KEY,
    platform_result_id CHAR(36) NOT NULL,
    source_provider_id CHAR(36) NULL,
    source_url VARCHAR(1000) NULL,
    snippet TEXT NULL,
    evidence_type VARCHAR(50) NOT NULL,
    raw_data_hash CHAR(64) NULL,
    retrieved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_evidence_platform (platform_result_id),
    INDEX idx_evidence_provider (source_provider_id),
    FOREIGN KEY (platform_result_id) REFERENCES platform_results(id) ON DELETE CASCADE,
    FOREIGN KEY (source_provider_id) REFERENCES source_providers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. spam_reports
CREATE TABLE IF NOT EXISTS spam_reports (
    id CHAR(36) PRIMARY KEY,
    phone_number_id CHAR(36) NOT NULL,
    source_provider_id CHAR(36) NULL,
    spam_category VARCHAR(50) DEFAULT 'unknown',
    report_count INT DEFAULT 1,
    risk_level VARCHAR(20) DEFAULT 'low',
    confidence_score FLOAT DEFAULT 0.0,
    reporter_ip_hash VARCHAR(64) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_spam_phone (phone_number_id),
    FOREIGN KEY (phone_number_id) REFERENCES phone_numbers(id) ON DELETE CASCADE,
    FOREIGN KEY (source_provider_id) REFERENCES source_providers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. ai_reports
CREATE TABLE IF NOT EXISTS ai_reports (
    id CHAR(36) PRIMARY KEY,
    lookup_task_id CHAR(36) NOT NULL UNIQUE,
    model_used VARCHAR(100) NOT NULL,
    key_findings JSON NULL,
    conflicting_evidence JSON NULL,
    reliability_assessment TEXT NULL,
    missing_information JSON NULL,
    risk_summary TEXT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ai_task (lookup_task_id),
    FOREIGN KEY (lookup_task_id) REFERENCES lookup_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. api_usage
CREATE TABLE IF NOT EXISTS api_usage (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    source_provider_id CHAR(36) NULL,
    endpoint VARCHAR(255) NOT NULL,
    status_code INT DEFAULT 200,
    latency_ms INT DEFAULT 0,
    units_consumed INT DEFAULT 1,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usage_user (user_id),
    INDEX idx_usage_timestamp (timestamp),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (source_provider_id) REFERENCES source_providers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NULL,
    resource_id VARCHAR(50) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    details JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_timestamp (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. consent_records
CREATE TABLE IF NOT EXISTS consent_records (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    legal_basis VARCHAR(50) DEFAULT 'legitimate_interest',
    consent_given_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL,
    valid_until DATETIME NULL,
    INDEX idx_consent_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. user_settings
CREATE TABLE IF NOT EXISTS user_settings (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL UNIQUE,
    default_country VARCHAR(5) DEFAULT 'IN',
    notify_on_job_completion BOOLEAN DEFAULT TRUE,
    preferred_ai_model VARCHAR(100) DEFAULT 'anthropic/claude-3.5-sonnet',
    table_column_prefs JSON NULL,
    theme VARCHAR(20) DEFAULT 'dark',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_settings_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
