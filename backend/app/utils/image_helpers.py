import io
import base64
from PIL import Image


def resize_image(image_bytes: bytes, size: tuple = (224, 224)) -> bytes:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(size)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def to_base64(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode()
