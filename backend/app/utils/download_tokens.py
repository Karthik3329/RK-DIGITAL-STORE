import hashlib
import secrets


def generate_download_token():
    """
    Generate a cryptographically secure random download token.
    The raw token is returned only once and should be sent by email.
    """
    return secrets.token_urlsafe(32)


def hash_download_token(token: str) -> str:
    """
    Hash the download token before storing it in MongoDB.
    The raw token is never stored in the database.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()