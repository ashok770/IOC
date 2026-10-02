import re
from typing import Optional, Callable, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict


class TechnologyRule(BaseModel):
    """
    Deterministic rule for detecting a publicly observable technology from verified evidence.
    No guesswork or speculative scoring.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)

    name: str = Field(..., description="Canonical product name")
    category: str = Field(..., description="Standard category: web_server, framework, cms, cdn, cloud, email, other")
    source_type: str = Field(..., description="Evidence type: http_headers, meta_tag, dns_record")
    detection_method: str = Field(..., description="Detection technique: response_header, meta_generator, dns_mx")
    header_key: Optional[str] = Field(None, description="HTTP header key to check (lowercased)")
    pattern: Optional[re.Pattern] = Field(None, description="Regex pattern matching target header or value")
    version_regex: Optional[re.Pattern] = Field(None, description="Pattern extracting reliable version string")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Documented deterministic confidence")


# =============================================================================
# DETERMINISTIC TECHNOLOGY RULES REPOSITORY
# =============================================================================

TECHNOLOGY_RULES: List[TechnologyRule] = [
    # -------------------------------------------------------------------------
    # Web Servers (Source: HTTP Response Headers)
    # Direct explicit headers -> High confidence (0.95)
    # -------------------------------------------------------------------------
    TechnologyRule(
        name="Nginx",
        category="web_server",
        source_type="http_headers",
        detection_method="response_header",
        header_key="server",
        pattern=re.compile(r"^nginx(?:\/([0-9.]+))?", re.IGNORECASE),
        version_regex=re.compile(r"nginx\/([0-9.]+)", re.IGNORECASE),
        confidence=0.95,
    ),
    TechnologyRule(
        name="Apache HTTP Server",
        category="web_server",
        source_type="http_headers",
        detection_method="response_header",
        header_key="server",
        pattern=re.compile(r"^apache(?:\/([0-9.]+))?", re.IGNORECASE),
        version_regex=re.compile(r"apache\/([0-9.]+)", re.IGNORECASE),
        confidence=0.95,
    ),
    TechnologyRule(
        name="Microsoft IIS",
        category="web_server",
        source_type="http_headers",
        detection_method="response_header",
        header_key="server",
        pattern=re.compile(r"^microsoft-iis(?:\/([0-9.]+))?", re.IGNORECASE),
        version_regex=re.compile(r"microsoft-iis\/([0-9.]+)", re.IGNORECASE),
        confidence=0.95,
    ),
    TechnologyRule(
        name="Caddy",
        category="web_server",
        source_type="http_headers",
        detection_method="response_header",
        header_key="server",
        pattern=re.compile(r"^caddy", re.IGNORECASE),
        version_regex=re.compile(r"caddy(?:\s+v?|\/)([0-9.]+)", re.IGNORECASE),
        confidence=0.95,
    ),
    TechnologyRule(
        name="OpenResty",
        category="web_server",
        source_type="http_headers",
        detection_method="response_header",
        header_key="server",
        pattern=re.compile(r"^openresty(?:\/([0-9.]+))?", re.IGNORECASE),
        version_regex=re.compile(r"openresty\/([0-9.]+)", re.IGNORECASE),
        confidence=0.95,
    ),
    TechnologyRule(
        name="LiteSpeed",
        category="web_server",
        source_type="http_headers",
        detection_method="response_header",
        header_key="server",
        pattern=re.compile(r"^litespeed", re.IGNORECASE),
        version_regex=None,
        confidence=0.95,
    ),
    TechnologyRule(
        name="Cloudflare Server",
        category="cdn",
        source_type="http_headers",
        detection_method="response_header",
        header_key="server",
        pattern=re.compile(r"^cloudflare", re.IGNORECASE),
        version_regex=None,
        confidence=0.95,
    ),
    TechnologyRule(
        name="Google Web Server",
        category="web_server",
        source_type="http_headers",
        detection_method="response_header",
        header_key="server",
        pattern=re.compile(r"^gws$", re.IGNORECASE),
        version_regex=None,
        confidence=0.95,
    ),

    # -------------------------------------------------------------------------
    # Application Frameworks (Source: X-Powered-By, etc.)
    # Direct explicit headers -> High confidence (0.95)
    # -------------------------------------------------------------------------
    TechnologyRule(
        name="PHP",
        category="framework",
        source_type="http_headers",
        detection_method="response_header",
        header_key="x-powered-by",
        pattern=re.compile(r"^php(?:\/([0-9.]+))?", re.IGNORECASE),
        version_regex=re.compile(r"php\/([0-9.]+)", re.IGNORECASE),
        confidence=0.95,
    ),
    TechnologyRule(
        name="Express",
        category="framework",
        source_type="http_headers",
        detection_method="response_header",
        header_key="x-powered-by",
        pattern=re.compile(r"^express", re.IGNORECASE),
        version_regex=None,
        confidence=0.95,
    ),
    TechnologyRule(
        name="ASP.NET",
        category="framework",
        source_type="http_headers",
        detection_method="response_header",
        header_key="x-powered-by",
        pattern=re.compile(r"^asp\.net", re.IGNORECASE),
        version_regex=re.compile(r"asp\.net(?:\s+v?|\/)([0-9.]+)", re.IGNORECASE),
        confidence=0.95,
    ),
    TechnologyRule(
        name="Next.js",
        category="framework",
        source_type="http_headers",
        detection_method="response_header",
        header_key="x-powered-by",
        pattern=re.compile(r"^next\.js", re.IGNORECASE),
        version_regex=None,
        confidence=0.95,
    ),

    # -------------------------------------------------------------------------
    # Content Management Systems (CMS)
    # Explicit Generator Header / Meta Tag -> High/Moderate confidence (0.85 - 0.90)
    # -------------------------------------------------------------------------
    TechnologyRule(
        name="WordPress",
        category="cms",
        source_type="http_headers",
        detection_method="response_header",
        header_key="x-generator",
        pattern=re.compile(r"wordpress(?:\s+([0-9.]+))?", re.IGNORECASE),
        version_regex=re.compile(r"wordpress\s+([0-9.]+)", re.IGNORECASE),
        confidence=0.90,
    ),
    TechnologyRule(
        name="WordPress",
        category="cms",
        source_type="meta_tag",
        detection_method="meta_generator",
        header_key=None,
        pattern=re.compile(r"wordpress(?:\s+([0-9.]+))?", re.IGNORECASE),
        version_regex=re.compile(r"wordpress\s+([0-9.]+)", re.IGNORECASE),
        confidence=0.85,
    ),
    TechnologyRule(
        name="Drupal",
        category="cms",
        source_type="http_headers",
        detection_method="response_header",
        header_key="x-generator",
        pattern=re.compile(r"drupal(?:\s+([0-9.]+))?", re.IGNORECASE),
        version_regex=re.compile(r"drupal\s+([0-9.]+)", re.IGNORECASE),
        confidence=0.90,
    ),
    TechnologyRule(
        name="Drupal",
        category="cms",
        source_type="meta_tag",
        detection_method="meta_generator",
        header_key=None,
        pattern=re.compile(r"drupal(?:\s+([0-9.]+))?", re.IGNORECASE),
        version_regex=re.compile(r"drupal\s+([0-9.]+)", re.IGNORECASE),
        confidence=0.85,
    ),
    TechnologyRule(
        name="Joomla",
        category="cms",
        source_type="meta_tag",
        detection_method="meta_generator",
        header_key=None,
        pattern=re.compile(r"joomla!(?:\s+([0-9.]+))?", re.IGNORECASE),
        version_regex=re.compile(r"joomla!\s+([0-9.]+)", re.IGNORECASE),
        confidence=0.85,
    ),
    TechnologyRule(
        name="Shopify",
        category="cms",
        source_type="http_headers",
        detection_method="response_header",
        header_key="x-shopify-stage",
        pattern=re.compile(r".+", re.IGNORECASE),
        version_regex=None,
        confidence=0.90,
    ),

    # -------------------------------------------------------------------------
    # Content Delivery Networks & Cloud Edge (CDN / Cloud)
    # Distinctive vendor header markers -> High confidence (0.95)
    # -------------------------------------------------------------------------
    TechnologyRule(
        name="Cloudflare",
        category="cdn",
        source_type="http_headers",
        detection_method="response_header",
        header_key="cf-ray",
        pattern=re.compile(r".+", re.IGNORECASE),
        version_regex=None,
        confidence=0.95,
    ),
    TechnologyRule(
        name="Amazon CloudFront",
        category="cdn",
        source_type="http_headers",
        detection_method="response_header",
        header_key="x-amz-cf-id",
        pattern=re.compile(r".+", re.IGNORECASE),
        version_regex=None,
        confidence=0.95,
    ),
    TechnologyRule(
        name="Fastly",
        category="cdn",
        source_type="http_headers",
        detection_method="response_header",
        header_key="x-fastly-request-id",
        pattern=re.compile(r".+", re.IGNORECASE),
        version_regex=None,
        confidence=0.95,
    ),
    TechnologyRule(
        name="Akamai",
        category="cdn",
        source_type="http_headers",
        detection_method="response_header",
        header_key="x-akamai-transformed",
        pattern=re.compile(r".+", re.IGNORECASE),
        version_regex=None,
        confidence=0.95,
    ),

    # -------------------------------------------------------------------------
    # Mail Ecosystems (Source: DNS MX Records)
    # Authoritative DNS host match -> High confidence (0.95)
    # -------------------------------------------------------------------------
    TechnologyRule(
        name="Google Workspace",
        category="email",
        source_type="dns_record",
        detection_method="dns_mx",
        header_key="MX",
        pattern=re.compile(r"(?:aspmx\.l\.google\.com|googlemail\.com|smtp\.google\.com)", re.IGNORECASE),
        version_regex=None,
        confidence=0.95,
    ),
    TechnologyRule(
        name="Microsoft 365",
        category="email",
        source_type="dns_record",
        detection_method="dns_mx",
        header_key="MX",
        pattern=re.compile(r"(?:mail\.protection\.outlook\.com|outlook\.com)", re.IGNORECASE),
        version_regex=None,
        confidence=0.95,
    ),
    TechnologyRule(
        name="Proofpoint",
        category="email",
        source_type="dns_record",
        detection_method="dns_mx",
        header_key="MX",
        pattern=re.compile(r"(?:pphosted\.com|proofpoint)", re.IGNORECASE),
        version_regex=None,
        confidence=0.95,
    ),
    TechnologyRule(
        name="Proton Mail",
        category="email",
        source_type="dns_record",
        detection_method="dns_mx",
        header_key="MX",
        pattern=re.compile(r"protonmail\.ch", re.IGNORECASE),
        version_regex=None,
        confidence=0.95,
    ),
]
