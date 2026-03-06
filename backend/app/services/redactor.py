import re

class Redactor:
    # Patterns for common sensitive data
    PATTERNS = {
        "EMAIL": r'[\w\.-]+@[\w\.-]+\.\w+',
        "PHONE": r'\b(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b',
        "CREDIT_CARD": r'\b(?:\d[ -]*?){13,16}\b',
    }

    @classmethod
    def redact(cls, text: str) -> str:
        redacted_text = text
        for label, pattern in cls.PATTERNS.items():
            # Replace found items with a placeholder like [EMAIL_REDACTED]
            redacted_text = re.sub(pattern, f"[{label}_REDACTED]", redacted_text)
        return redacted_text

    @classmethod
    def scan_for_violations(cls, text: str) -> list:
        """Returns a list of what was found (for the audit log)"""
        violations = []
        for label, pattern in cls.PATTERNS.items():
            if re.search(pattern, text):
                violations.append(label)
        return violations