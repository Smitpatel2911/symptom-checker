"""AI Symptom Analysis microservice (FastAPI).

Rule-based, weighted-scoring recommender. It maps symptoms to possible
conditions and a recommended medical specialty. It is NOT a medical diagnosis.
"""
import json
import os
import re
import secrets
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

load_dotenv()

DATA_FILE = Path(__file__).parent / "data" / "symptoms.json"
with open(DATA_FILE, encoding="utf-8") as f:
    DATA = json.load(f)

KNOWN_SYMPTOMS = {s.lower() for s in DATA["symptoms"]}
RED_FLAGS = {s.lower() for s in DATA["red_flag_symptoms"]}
CONDITIONS = DATA["conditions"]

# Everyday phrases -> canonical symptom names (used for the free-text box)
SYNONYMS = {
    "stomach ache": "abdominal pain",
    "stomach pain": "abdominal pain",
    "tummy": "abdominal pain",
    "belly pain": "abdominal pain",
    "tired": "fatigue",
    "weakness": "fatigue",
    "exhausted": "fatigue",
    "throwing up": "vomiting",
    "loose motion": "diarrhea",
    "loose stool": "diarrhea",
    "breathless": "shortness of breath",
    "difficulty breathing": "shortness of breath",
    "cold": "runny nose",
    "temperature": "fever",
    "high temp": "fever",
    "tooth pain": "toothache",
    "knee pain": "joint pain",
    "throat pain": "sore throat",
    "can't sleep": "insomnia",
    "sad": "low mood",
    "depressed": "low mood",
    "stressed": "anxiety",
    "palpitation": "palpitations",
    "giddy": "dizziness",
    "lightheaded": "dizziness",
    "pimples": "acne",
    "burning while urinating": "burning urination",
    "peeing often": "frequent urination",
}

app = FastAPI(
    title="Symptom Analysis Service",
    description="Rule-based symptom -> condition/specialty recommender. Not a medical diagnosis.",
    version="1.0.0",
)


def verify_api_key(x_api_key: Optional[str] = Header(default=None)) -> None:
    """Internal service-to-service auth. If AI_SERVICE_KEY is unset (local dev), skip the check."""
    expected = os.getenv("AI_SERVICE_KEY")
    if not expected:
        return
    if not x_api_key or not secrets.compare_digest(x_api_key, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


class PredictRequest(BaseModel):
    symptoms: list[str] = Field(default_factory=list, max_length=25)
    free_text: Optional[str] = Field(default=None, max_length=500)
    age: Optional[int] = Field(default=None, ge=0, le=120)
    gender: Optional[str] = Field(default=None, max_length=20)


class ConditionResult(BaseModel):
    name: str
    specialty: str
    severity: str
    confidence: float


class PredictResponse(BaseModel):
    matched_symptoms: list[str]
    results: list[ConditionResult]
    recommended_specialty: str
    urgent: bool
    urgent_reasons: list[str]
    disclaimer: str


def extract_from_text(text: str) -> set[str]:
    """Find known symptoms and common synonyms inside free text."""
    found: set[str] = set()
    lowered = text.lower()
    for symptom in KNOWN_SYMPTOMS:
        if re.search(r"\b" + re.escape(symptom) + r"\b", lowered):
            found.add(symptom)
    for phrase, symptom in SYNONYMS.items():
        if re.search(r"\b" + re.escape(phrase) + r"\b", lowered):
            found.add(symptom)
    return found


def analyze(symptoms: set[str]) -> tuple[list[ConditionResult], str]:
    scored = []
    for cond in CONDITIONS:
        weights = {k.lower(): v for k, v in cond["symptoms"].items() if v > 0}
        total_weight = sum(weights.values())
        matched = symptoms & weights.keys()
        if not matched:
            continue
        matched_weight = sum(weights[s] for s in matched)
        relevance = matched_weight / total_weight      # how much of the condition is explained
        precision = len(matched) / len(symptoms)       # how much of the user's input is explained
        score = 0.6 * relevance + 0.4 * precision
        scored.append((score, cond))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:3]

    results = [
        ConditionResult(
            name=c["name"],
            specialty=c["specialty"],
            severity=c["severity"],
            confidence=round(min(score, 0.95) * 100, 1),
        )
        for score, c in top
    ]

    # Recommended specialty = specialty with the highest total score among top results
    specialty_scores: dict[str, float] = {}
    for score, c in top:
        specialty_scores[c["specialty"]] = specialty_scores.get(c["specialty"], 0) + score
    specialty = max(specialty_scores, key=specialty_scores.get) if specialty_scores else "General Physician"
    return results, specialty


@app.get("/health")
def health():
    return {"status": "ok", "conditions": len(CONDITIONS), "symptoms": len(KNOWN_SYMPTOMS)}


@app.get("/symptoms", dependencies=[Depends(verify_api_key)])
def list_symptoms():
    return {"symptoms": sorted(KNOWN_SYMPTOMS)}


@app.post("/predict", response_model=PredictResponse, dependencies=[Depends(verify_api_key)])
def predict(req: PredictRequest):
    symptoms = {s.strip().lower() for s in req.symptoms if s and s.strip()}
    if req.free_text:
        symptoms |= extract_from_text(req.free_text)

    recognised = symptoms & KNOWN_SYMPTOMS
    if not recognised:
        raise HTTPException(
            status_code=422,
            detail="No recognisable symptoms provided. Select at least one symptom or describe it in the text box.",
        )

    results, specialty = analyze(recognised)

    urgent_reasons = sorted(recognised & RED_FLAGS)
    urgent = bool(urgent_reasons) or any(r.severity == "high" and r.confidence >= 50 for r in results)

    return PredictResponse(
        matched_symptoms=sorted(recognised),
        results=results,
        recommended_specialty=specialty,
        urgent=urgent,
        urgent_reasons=urgent_reasons,
        disclaimer="This is not a medical diagnosis. Please consult a qualified doctor.",
    )
