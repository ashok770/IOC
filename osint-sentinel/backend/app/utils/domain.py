import re
import ipaddress
from typing import Tuple


DOMAIN_LABEL_REGEX = re.compile(r"^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$")
TLD_REGEX = re.compile(r"^([a-z]{2,63}|xn--[a-z0-9-]{2,59})$")


def normalize_and_validate_domain(raw_input: str) -> str:
    """
    Validates and normalizes an input domain string for authorized assessment scoping.
    Strictly prohibits arbitrary URLs, protocols, paths, query parameters, and IP addresses.

    Raises:
        ValueError: If the input is not a valid fully qualified domain name.
    """
    if not raw_input or not isinstance(raw_input, str):
        raise ValueError("Domain target cannot be empty.")

    cleaned = raw_input.strip()
    if not cleaned:
        raise ValueError("Domain target cannot be empty.")

    # Reject IPv4 or IPv6 literals (check before character checks so ::1 is caught as IP)
    try:
        ipaddress.ip_address(cleaned)
        raise ValueError(
            "IP addresses are not permitted as domain targets. "
            "An assessment target must be a fully qualified domain name."
        )
    except ValueError as e:
        if "IP addresses are not permitted" in str(e):
            raise

    # Reject protocols and URLs
    if "://" in cleaned or cleaned.startswith(("//", "/", "?", "#")):
        raise ValueError(
            "Arbitrary URLs with protocols, paths, or query parameters are prohibited. "
            "Please provide a fully qualified domain name (e.g., example.com)."
        )

    # Reject paths, queries, fragments, ports, or credentials
    if any(char in cleaned for char in ["/", "?", "#", "@", ":", "\\", " ", "\t", "\n"]):
        raise ValueError(
            "Invalid characters detected. Domain must not include paths, ports, or query parameters."
        )

    # Normalization: lower-case and strip trailing dot (standard DNS FQDN representation)
    domain = cleaned.lower().rstrip(".")

    if len(domain) > 253:
        raise ValueError("Domain name exceeds maximum permitted length of 253 characters.")

    # Domain label segmentation
    labels = domain.split(".")
    if len(labels) < 2:
        raise ValueError(
            f"Invalid domain '{domain}'. Target must contain at least a second-level domain "
            "and a top-level domain (e.g., example.com)."
        )

    for i, label in enumerate(labels):
        if not label:
            raise ValueError(f"Domain '{domain}' contains empty labels.")
        if len(label) > 63:
            raise ValueError(f"Domain label '{label}' exceeds maximum permitted length of 63 characters.")
        if not DOMAIN_LABEL_REGEX.match(label):
            raise ValueError(
                f"Domain label '{label}' contains invalid characters or leading/trailing hyphens."
            )

    # Top-level domain validation (last label)
    tld = labels[-1]
    if not TLD_REGEX.match(tld):
        raise ValueError(
            f"Top-level domain '.{tld}' is invalid. TLD must be alphabetic or valid punycode."
        )

    return domain
