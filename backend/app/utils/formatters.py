from datetime import datetime


def format_datetime(dt: datetime) -> str:
    return dt.isoformat() if dt else None


def success_response(data: dict, message: str = "success") -> dict:
    return {"status": "success", "message": message, "data": data}


def error_response(message: str, code: int = 400) -> dict:
    return {"status": "error", "message": message, "code": code}
