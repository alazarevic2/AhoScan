import { useEffect, useState } from 'react';
import { api } from './client.js';
import Welcome from './pages/Welcome.jsx';
import CreateJob from './pages/CreateJob.jsx';
import UploadResumes from './pages/UploadResumes.jsx';
import Results from './pages/Results.jsx';
import CandidateDetail from './pages/CandidateDetail.jsx';

// The three steps shown in the step bar at the top.
const STEPS = [
  { key: 'job', label: 'Job & keywords' },
  { key: 'upload', label: 'Upload resumes' },
  { key: 'results', label: 'Results' },
];

export default function App() {
  const [view, setView] = useState('welcome'); // which page 
  const [job, setJob] = useState(null);
  const [resumes, setResumes] = useState([]);   // [{ name, text }]
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(0);  // which result the detail page shows

  // Scroll back to the top whenever the page changes
  useEffect(() => { window.scrollTo(0, 0); }, [view]);

  // A job was saved or picked - make it the current job and go to the upload step
  function chooseJob(savedJob) {
    setJob(savedJob);
    setResults([]); // old results were for the old keywords
    setView('upload');
  }

  // Clear everything and go back to the welcome page
  function startOver() {
    setJob(null);
    setResumes([]);
    setResults([]);
    setView('welcome');
  }

  // Ask first, then delete the current job and start over
  async function deleteJob() {
    if (!window.confirm(`Delete the job "${job.title}"? This can't be undone.`)) return;
    await api.deleteJob(job.id);
    startOver();
  }

  // Send the resumes to the backend and show the results page
  async function runScan() {
    const data = await api.scan(job.id, resumes);
    setResults(data.results);
    setView('results');
  }

  // Steps you can't reach yet are disabled in the step bar
  const canOpen = { job: true, upload: !!job, results: results.length > 0 };
  // The detail page counts as part of the Results step
  const current = view === 'detail' ? 'results' : view;

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => setView('welcome')}>
          <span className="brand-name">AhoScan</span>
          <span className="brand-tagline">Multi-Pattern Resume Screening Tool</span>
        </button>
        {view !== 'welcome' && (
          <nav className="steps">
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                className={`step ${current === s.key ? 'is-current' : ''}`}
                disabled={!canOpen[s.key]}
                onClick={() => setView(s.key)}
              >
                <span className="step-num">{i + 1}</span>
                <span className="step-label">{s.label}</span>
              </button>
            ))}
          </nav>
        )}
      </header>

      <main>
        {view === 'welcome' && (
          <Welcome onStart={() => { setJob(null); setView('job'); }} onUseJob={chooseJob} />
        )}
        {view === 'job' && <CreateJob job={job} onSaved={chooseJob} />}
        {view === 'upload' && (
          <UploadResumes
            job={job}
            resumes={resumes}
            setResumes={setResumes}
            onScan={runScan}
            onEditJob={() => setView('job')}
          />
        )}
        {view === 'results' && (
          <Results
            job={job}
            results={results}
            onOpen={(i) => { setSelected(i); setView('detail'); }}
            onAddMore={() => setView('upload')}
            onStartOver={startOver}
            onDeleteJob={deleteJob}
          />
        )}
        {view === 'detail' && (
          <CandidateDetail
            result={results[selected]}
            text={resumes.find((r) => r.name === results[selected].resume)?.text ?? ''}
            index={selected}
            total={results.length}
            onNavigate={setSelected}
            onBack={() => setView('results')}
          />
        )}
      </main>
    </div>
  );
}
