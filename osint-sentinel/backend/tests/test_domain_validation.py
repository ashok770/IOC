import pytest
from app.utils.domain import normalize_and_validate_domain


def test_valid_domain_normalization():
    assert normalize_and_validate_domain("EXAMPLE.COM") == "example.com"
    assert normalize_and_validate_domain("  sub.domain.co.uk.  ") == "sub.domain.co.uk"
    assert normalize_and_validate_domain("my-target.org") == "my-target.org"


def test_reject_arbitrary_urls_with_protocols():
    with pytest.raises(ValueError, match="Arbitrary URLs"):
        normalize_and_validate_domain("https://example.com")
    with pytest.raises(ValueError, match="Arbitrary URLs"):
        normalize_and_validate_domain("http://sub.example.com/path")
    with pytest.raises(ValueError, match="Arbitrary URLs"):
        normalize_and_validate_domain("//example.com")


def test_reject_paths_and_query_strings():
    with pytest.raises(ValueError, match="Invalid characters"):
        normalize_and_validate_domain("example.com/test")
    with pytest.raises(ValueError, match="Invalid characters"):
        normalize_and_validate_domain("example.com?query=1")
    with pytest.raises(ValueError, match="Invalid characters"):
        normalize_and_validate_domain("example.com:8080")


def test_reject_ip_addresses():
    with pytest.raises(ValueError, match="IP addresses are not permitted"):
        normalize_and_validate_domain("192.168.1.1")
    with pytest.raises(ValueError, match="IP addresses are not permitted"):
        normalize_and_validate_domain("10.0.0.1")
    with pytest.raises(ValueError, match="IP addresses are not permitted"):
        normalize_and_validate_domain("::1")


def test_reject_single_labels_and_invalid_tld():
    with pytest.raises(ValueError, match="Target must contain at least a second-level domain"):
        normalize_and_validate_domain("localhost")
    with pytest.raises(ValueError, match="Target must contain at least a second-level domain"):
        normalize_and_validate_domain("internal")
    with pytest.raises(ValueError, match="Top-level domain"):
        normalize_and_validate_domain("example.123")


def test_reject_empty_and_whitespace():
    with pytest.raises(ValueError, match="cannot be empty"):
        normalize_and_validate_domain("")
    with pytest.raises(ValueError, match="cannot be empty"):
        normalize_and_validate_domain("   ")
