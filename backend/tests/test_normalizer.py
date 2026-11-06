import pytest
from app.services.normalizer_service import phone_normalizer
from app.services.file_parser_service import file_parser


def test_clean_raw_input():
    raw = " +91 (987) 654-3210 "
    cleaned = phone_normalizer.clean_raw_input(raw)
    assert cleaned == "+919876543210"


def test_indian_mobile_normalization():
    res = phone_normalizer.parse_and_normalize("+919876543210", "IN")
    assert res.is_valid is True
    assert res.e164_format == "+919876543210"
    assert res.country_code == "91"
    assert res.country_iso2 == "IN"
    assert res.number_type == "mobile"


def test_us_toll_free_normalization():
    res = phone_normalizer.parse_and_normalize("1-800-273-8255", "US")
    assert res.is_valid is True
    assert res.e164_format == "+18002738255"
    assert res.country_code == "1"
    assert res.country_iso2 == "US"
    assert res.number_type == "toll_free"


def test_invalid_number():
    res = phone_normalizer.parse_and_normalize("12345", "IN")
    assert res.is_valid is False


def test_file_parser_preflight():
    raw_text = """
    +919876543210
    9876543210
    +18002738255
    invalid-num-999
    +919876543210
    """
    candidates = file_parser.extract_from_raw_text(raw_text)
    preflight = file_parser.preflight_validate(candidates, "IN")
    assert preflight.total_detected == 5
    assert preflight.valid_count == 2
    assert preflight.duplicate_count == 2
    assert preflight.invalid_count == 1
