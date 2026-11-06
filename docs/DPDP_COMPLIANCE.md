# Indian DPDP Act 2023 & Ethical OSINT Compliance Framework

NumberIntel AI is engineered from the ground up under **Privacy-by-Design** principles, adhering strictly to:
- **Digital Personal Data Protection Act (DPDP Act 2023, India)**
- **General Data Protection Regulation (GDPR, EU)**
- **Telecommunications (Telecom) Regulatory Guidelines**
- **Platform Terms of Service & API Policies**

---

## 1. Zero Fabrication Policy
1. **No Fake Results**: The platform never fabricates or hallucinates identities, names, or addresses.
2. **Immutable Evidence Trail**: Every datum displayed on screen or exported to reports is paired with an immutable entry in the `evidence_records` database table, containing:
   - Source Provider name
   - Source URL
   - Retrieval timestamp
   - Cryptographic SHA-256 data hash
3. **Transparent Unknowns**: Where reverse phone lookup is not lawfully available (e.g. Signal zero-knowledge protocol, private Instagram accounts), the system explicitly displays `NOT_PUBLICLY_VERIFIABLE` rather than guessing or associating arbitrary users with similar names.

---

## 2. Prohibition on Illicit Enumeration & Scraping
1. **No Account Enumeration**: The system never runs brute-force loops or contact-synchronization scraping against consumer messaging apps (WhatsApp, Telegram, Signal) to check whether private accounts exist.
2. **No Credential Stuffing**: Only official APIs and publicly indexed web search indices are queried.
3. **No Private Account Scraping**: Only publicly indexed commercial profiles, business directories, and corporate press releases are parsed.

---

## 3. Lawful Basis & Consent Logging (`consent_records`)
- **Legitimate Interest**: Fraud prevention, enterprise risk mitigation, cybersecurity investigation, and due diligence under Section 7 of the DPDP Act 2023.
- **Audit Logging**: Every search query, bulk upload, and report download is immutably logged in the `audit_logs` table with user ID, timestamp, and client IP hash.

---

## 4. Anonymization & Security Controls
1. **IP Hashing**: Reporter IP addresses in community spam reports are converted into salted SHA-256 digests (`reporter_ip_hash`), preventing deanonymization of reporters while neutralizing spam abuse.
2. **AES-256 Key Encryption**: Stored external API keys are encrypted at rest using AES-256 Fernet cryptography.
3. **Automated Data Purging**: Automated retention controls purge transient lookup tasks after 90 days (`DATA_RETENTION_DAYS`).
4. **Right to Erasure**: User and investigation deletion endpoints remove associated phone intelligence dossiers in full.
