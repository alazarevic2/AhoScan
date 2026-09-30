# The backend web server (API only), with one function per route

from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile

from extract import extract_text
from job_store import JobStore
from models import Job, ScanRequest, validate_job
from scan_service import scan_resume

JOBS_DIR = Path(__file__).resolve().parents[1] / "data" / "jobs"

store = JobStore(JOBS_DIR)
app = FastAPI(title="AhoScan")


# Get a job by id, or send error if it doesn't exist
def find_job(job_id):
    if job_id not in store.jobs:
        raise HTTPException(404, "No job with that id")
    return store.jobs[job_id]


# Send error with a readable message if the job isn't valid
def check(job):
    error = validate_job(job)
    if error:
        raise HTTPException(400, error)


# All saved jobs, for the list on the welcome page
@app.get("/api/jobs")
def list_jobs():
    return [{"id": j.id, "title": j.title, "requirementCount": len(j.requirements)}
            for j in store.jobs.values()]


# One job with all its keywords
@app.get("/api/jobs/{job_id}")
def get_job(job_id: str):
    return find_job(job_id)


# Save a new job
@app.post("/api/jobs")
def create_job(job: Job):
    check(job)
    return store.create(job)


# Replace an existing job's title and keywords
@app.put("/api/jobs/{job_id}")
def update_job(job_id: str, job: Job):
    find_job(job_id)
    check(job)
    job.id = job_id
    return store.save(job)


# Delete a job
@app.delete("/api/jobs/{job_id}")
def delete_job(job_id: str):
    find_job(job_id)
    store.delete(job_id)
    return {"deleted": job_id}


# Read the text out of uploaded resume files
@app.post("/api/extract")
def extract(files: list[UploadFile]):
    resumes, errors = [], []
    for f in files:
        try:
            resumes.append({"name": f.filename, "text": extract_text(f.filename, f.file.read())})
        except ValueError as e:
            errors.append(str(e))
        except Exception:
            errors.append(f"{f.filename}: couldn't be read (is the file damaged?)")
    return {"resumes": resumes, "errors": errors}


# Scan resumes against a job
# The job's matcher was built when the job was
# saved, and the same one is used for every resume
@app.post("/api/jobs/{job_id}/scan")
def scan(job_id: str, request: ScanRequest):
    job = find_job(job_id)
    matcher = store.matchers[job_id]
    return {"results": [scan_resume(job, matcher, r.name, r.text) for r in request.resumes]}
