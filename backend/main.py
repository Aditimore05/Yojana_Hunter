from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API Gateway for Yojana Hunter — AI-powered scheme discovery and eligibility matching.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware for Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular API routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "tagline": "Beyond Searching Schemes, Getting Citizens the Benefits They Deserve",
        "api_docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
