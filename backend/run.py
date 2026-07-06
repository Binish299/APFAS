import uvicorn
import os

if __name__ == "__main__":
    # Ensure current directory is added to Python path
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    print("[Server Setup] Launching FastAPI local server on http://localhost:8000...")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
