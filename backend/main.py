from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Contract Risk Scanner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all. In prod, restrict to extension ID.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScanRequest(BaseModel):
    text: str
    url: Optional[str] = None

class Risk(BaseModel):
    category: str
    severity: str  # "high", "medium", "low"
    description: str
    original_text: str

class ScanResponse(BaseModel):
    summary: str
    score: int
    risks: List[Risk]

def mock_analyze_contract(text: str) -> ScanResponse:
    """
    Mock analysis for testing without burning API credits.
    """
    # Simple keyword-based mock detection
    risks = []
    
    lower_text = text.lower()
    
    if "arbitration" in lower_text:
        risks.append(Risk(
            category="Dispute Resolution",
            severity="high",
            description="Forced arbitration clause detected. This may waive your right to a jury trial.",
            original_text="arbitration" # In a real app, this would be the full sentence
        ))
    
    if "indemnification" in lower_text:
        risks.append(Risk(
            category="Liability",
            severity="medium",
            description="Indemnification clause. You may be liable for third-party claims.",
            original_text="indemnification"
        ))

    if "automatic renewal" in lower_text:
        risks.append(Risk(
            category="Financial",
            severity="medium",
            description="Automatic renewal clause. Contract renews automatically unless cancelled.",
            original_text="automatic renewal"
        ))
        
    summary = "This contract contains standard terms, but watch out for specific liability and dispute resolution clauses."
    score = 85 - (len(risks) * 10)
    
    return ScanResponse(
        summary=summary,
        score=score,
        risks=risks
    )

@app.post("/scan", response_model=ScanResponse)
async def scan_contract(request: ScanRequest):
    try:
        # In the future, we will toggle between mock and real AI here
        # api_key = os.getenv("OPENAI_API_KEY")
        # if api_key:
        #     return await ai_analyze_contract(request.text, api_key)
        
        return mock_analyze_contract(request.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "AI Contract Risk Scanner API is running"}
