# TF-IDF + Logistic Regression / scikit-learn
from app.ml.base import BaseMLModel


class symptomModel(BaseMLModel):
    def load(self) -> None:
        # TODO: load model file from ml/models/
        pass

    def preprocess(self, input_data):
        # TODO: preprocess input
        pass

    def infer(self, preprocessed):
        # TODO: run inference
        pass

    def postprocess(self, raw_output) -> dict:
        # TODO: format output
        return {}
