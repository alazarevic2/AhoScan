# AhoScan: Multi-Pattern Resume Screening Tool

AhoScan checks a batch of resumes against a job's keywords. Enter a job title
and keywords, upload resumes (PDF, DOCX or TXT), and see which keywords each
resume mentions and where. The matching uses a hand-written Aho–Corasick
algorithm (`backend/aho_corasick.py`).

## Running it

You need **Python 3.10+** and **Node.js 18+**. Nothing needs compiling; you
only install the packages the first time.

**1. Get the code**

```bash
git clone https://github.com/alazarevic2/AhoScan.git
cd AhoScan
```

**2. Backend** (terminal 1, from the `AhoScan` folder)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

On macOS/Linux, activate with `source .venv/bin/activate` instead.
Leave this terminal running.

**3. Frontend** (terminal 2, from the `AhoScan` folder)

```bash
cd frontend
npm install
npm run dev
```

**4. Open http://localhost:5173**

**Next time**, skip the install steps: in terminal 1 run `cd backend`,
`.venv\Scripts\activate`, `python run.py`, and in terminal 2 run
`cd frontend`, `npm run dev`.

**Windows tips:** if `python` opens the Microsoft Store, use `py` instead.
If PowerShell refuses to run `activate` or `npm`, run
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use `npm.cmd`.

## Trying it with the sample data

Copy the files in `data/examples/` into `data/jobs/` (before starting the
backend) to add five example jobs. Then choose a job in the app and upload the
resumes from the matching folder in `sample-resumes/`.

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
- `sample-resumes/`: fictional resumes (PDF, DOCX, TXT) for five industries
