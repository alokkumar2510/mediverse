from abc import ABC, abstractmethod


class BaseMLModel(ABC):
    """All ML models must implement this interface."""

    @abstractmethod
    def load(self) -> None:
        """Load model weights into memory."""

    @abstractmethod
    def preprocess(self, input_data):
        """Prepare raw input for inference."""

    @abstractmethod
    def infer(self, preprocessed):
        """Run model inference."""

    @abstractmethod
    def postprocess(self, raw_output) -> dict:
        """Convert raw output to API response dict."""
