# AhoScan: Multi-Pattern Resume Screening Tool

AhoScan checks a batch of resumes against a job's keywords. Enter a job title
and keywords, upload resumes (PDF, DOCX or TXT), and see which keywords each
resume mentions and where. The matching uses a hand-written Aho–Corasick
algorithm (`backend/aho_corasick.py`).

## Running it

No compiling needed. You need Python 3.10+ and Node.js 18+.

**Backend** (terminal 1):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

**Frontend** (terminal 2):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

To try it, copy the files in `data/examples/` into `data/jobs/` before starting
the backend (this adds five example jobs), then upload resumes from the matching
folder in `sample-resumes/`.

## Tests

```bash
cd backend
pytest
```

## Files

- `backend/aho_corasick.py`: the Aho–Corasick algorithm
- `backend/matcher.py`: matching rules (case, whole words, overlaps)
- `backend/`: the rest of the API (jobs, file reading, results)
- `frontend/src/`: the React app
- `data/`: saved jobs and example jobs
- `sample-resumes/`: fictional resumes (PDF, DOCX, TXT) for five industries, to try the app with
