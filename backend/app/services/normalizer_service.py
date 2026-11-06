import re
from typing import Optional, Dict, Any, List
import phonenumbers
from phonenumbers import carrier, geocoder, timezone, PhoneNumberType
from app.schemas.schemas import NormalizedPhoneResult


NUMBER_TYPE_MAPPING = {
    PhoneNumberType.FIXED_LINE: "fixed_line",
    PhoneNumberType.MOBILE: "mobile",
    PhoneNumberType.FIXED_LINE_OR_MOBILE: "mobile",
    PhoneNumberType.TOLL_FREE: "toll_free",
    PhoneNumberType.PREMIUM_RATE: "premium_rate",
    PhoneNumberType.SHARED_COST: "shared_cost",
    PhoneNumberType.VOIP: "voip",
    PhoneNumberType.PERSONAL_NUMBER: "personal_number",
    PhoneNumberType.PAGER: "pager",
    PhoneNumberType.UAN: "uan",
    PhoneNumberType.VOICEMAIL: "voicemail",
    PhoneNumberType.UNKNOWN: "unknown",
}


class PhoneNormalizerService:
    @staticmethod
    def clean_raw_input(raw: str) -> str:
        """Strip non-phone noise characters except leading + and digits."""
        if not raw:
            return ""
        # Remove whitespace, parentheses, dashes, dots, quotes
        cleaned = re.sub(r'[\s\(\)\-\.\"\']', '', raw.strip())
        return cleaned

    @classmethod
    def parse_and_normalize(cls, raw_input: str, default_region: str = "IN") -> NormalizedPhoneResult:
        cleaned = cls.clean_raw_input(raw_input)
        if not cleaned:
            return NormalizedPhoneResult(
                raw_input=raw_input,
                e164_format="",
                national_format="",
                country_code="",
                country_iso2="",
                number_type="unknown",
                is_valid=False,
                carrier_name=None,
                line_type=None,
                timezones=[]
            )

        try:
            # If number starts with '+', parse without region hint; else use default_region
            region = None if cleaned.startswith("+") else default_region.upper()
            parsed = phonenumbers.parse(cleaned, region)
            
            is_valid = phonenumbers.is_valid_number(parsed)
            e164_format = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
            national_format = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.NATIONAL)
            country_code = str(parsed.country_code)
            country_iso2 = phonenumbers.region_code_for_number(parsed) or ""
            
            raw_type = phonenumbers.number_type(parsed)
            number_type = NUMBER_TYPE_MAPPING.get(raw_type, "unknown")
            
            carrier_name = carrier.name_for_number(parsed, "en") or None
            line_type = number_type.replace("_", " ").title()
            tz_list = list(timezone.time_zones_for_number(parsed))

            return NormalizedPhoneResult(
                raw_input=raw_input,
                e164_format=e164_format,
                national_format=national_format,
                country_code=country_code,
                country_iso2=country_iso2,
                number_type=number_type,
                is_valid=is_valid,
                carrier_name=carrier_name,
                line_type=line_type,
                timezones=tz_list
            )
        except phonenumbers.NumberParseException:
            # Try prepending '+' if it looked international
            if not cleaned.startswith("+") and len(cleaned) > 10:
                try:
                    parsed = phonenumbers.parse(f"+{cleaned}", None)
                    if phonenumbers.is_valid_number(parsed):
                        return cls.parse_and_normalize(f"+{cleaned}", default_region)
                except Exception:
                    pass

            return NormalizedPhoneResult(
                raw_input=raw_input,
                e164_format=cleaned if cleaned.startswith("+") else f"+{cleaned}",
                national_format=cleaned,
                country_code="",
                country_iso2="",
                number_type="unknown",
                is_valid=False,
                carrier_name=None,
                line_type="Invalid Format",
                timezones=[]
            )


phone_normalizer = PhoneNormalizerService()
