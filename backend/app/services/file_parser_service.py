import re
import csv
import io
from typing import List, Tuple, Set, Optional
import openpyxl
from app.services.normalizer_service import phone_normalizer
from app.schemas.schemas import PreflightValidationResult, NormalizedPhoneResult


class FileParserService:
    @staticmethod
    def extract_from_raw_text(text: str) -> List[str]:
        """Extract candidate phone numbers from raw multiline or comma-separated string."""
        if not text:
            return []
        # Split by newlines, semicolons, or commas
        lines = re.split(r'[\r\n,;]+', text)
        candidates = []
        for line in lines:
            trimmed = line.strip()
            if trimmed:
                candidates.append(trimmed)
        return candidates

    @classmethod
    def parse_csv(cls, file_content: bytes) -> List[str]:
        """Parse CSV bytes, intelligently discovering the phone number column."""
        text_stream = io.StringIO(file_content.decode('utf-8', errors='replace'))
        reader = csv.reader(text_stream)
        rows = list(reader)
        if not rows:
            return []

        # Check if first row is header
        header = [col.lower().strip() for col in rows[0]]
        phone_col_idx = -1
        keywords = ['phone', 'mobile', 'tel', 'cell', 'contact', 'number']
        
        for idx, col_name in enumerate(header):
            if any(kw in col_name for kw in keywords):
                phone_col_idx = idx
                break

        candidates = []
        start_row = 1 if phone_col_idx != -1 else 0
        if phone_col_idx == -1:
            phone_col_idx = 0 # Default to first column

        for row in rows[start_row:]:
            if row and len(row) > phone_col_idx:
                val = row[phone_col_idx].strip()
                if val:
                    candidates.append(val)
        return candidates

    @classmethod
    def parse_excel(cls, file_content: bytes) -> List[str]:
        """Parse XLSX bytes via openpyxl."""
        stream = io.BytesIO(file_content)
        wb = openpyxl.load_workbook(stream, data_only=True)
        sheet = wb.active
        candidates = []

        # Find header column
        header_row = [cell.value for cell in next(sheet.iter_rows(max_row=1))]
        phone_col_idx = 0
        keywords = ['phone', 'mobile', 'tel', 'cell', 'contact', 'number']
        
        has_header = False
        for idx, col in enumerate(header_row):
            col_str = str(col).lower().strip() if col else ""
            if any(kw in col_str for kw in keywords):
                phone_col_idx = idx
                has_header = True
                break

        row_generator = sheet.iter_rows(values_only=True)
        if has_header:
            next(row_generator, None) # Skip header

        for row in row_generator:
            if row and len(row) > phone_col_idx:
                val = row[phone_col_idx]
                if val is not None:
                    candidates.append(str(val).strip())
        return candidates

    @classmethod
    def preflight_validate(cls, candidates: List[str], default_country: str = "IN") -> PreflightValidationResult:
        """Run libphonenumber normalization, remove duplicates, partition into valid vs invalid."""
        seen_e164: Set[str] = set()
        seen_raw: Set[str] = set()
        
        valid_items: List[NormalizedPhoneResult] = []
        invalid_items: List[str] = []
        duplicate_count = 0

        for raw in candidates:
            cleaned = phone_normalizer.clean_raw_input(raw)
            if not cleaned or len(cleaned) < 5:
                continue

            normalized = phone_normalizer.parse_and_normalize(raw, default_country)
            
            # Check deduplication on E.164 (or cleaned raw if invalid)
            key = normalized.e164_format if normalized.is_valid else cleaned
            if key in seen_e164:
                duplicate_count += 1
                continue
            seen_e164.add(key)

            if normalized.is_valid:
                valid_items.append(normalized)
            else:
                invalid_items.append(raw)

        return PreflightValidationResult(
            total_detected=len(candidates),
            valid_count=len(valid_items),
            invalid_count=len(invalid_items),
            duplicate_count=duplicate_count,
            valid_samples=valid_items[:50], # first 50 sample previews
            invalid_samples=invalid_items[:20]
        )


file_parser = FileParserService()
