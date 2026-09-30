# Starts the backend (the API) on http://localhost:8000.
import uvicorn

if __name__ == "__main__":
    print("AhoScan API running on http://localhost:8000 (Ctrl+C to stop)")
    print("Now start the frontend: cd frontend, then npm run dev")
    uvicorn.run("app:app", port=8000)
