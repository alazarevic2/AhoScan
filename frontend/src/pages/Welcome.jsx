// Welcome page: says what the tool does and shows the three steps.
// Once at least one job has been saved, it also lists them so one can be reused
import { useEffect, useState } from 'react';
import { api } from '../client.js';

// The three "How it works" cards
const WORKFLOW = [
  {
    title: 'Describe the job',
    body: 'Give the role a title and paste in the skills, tools and qualifications you’re looking for.',
    example: 'Customer service, project management, Microsoft Excel, Python',
  },
  {
    title: 'Upload resumes',
    body: 'Drag and drop all the resumes/applications you’ve received. PDF, Word and text files work.',
    example: '24 files · PDF, DOCX, TXT',
  },
  {
    title: 'Scan and review',
    body: 'See which of your keywords each resume mentions, and read every mention in context before you decide who to contact.',
    example: '3 / 4 required keywords found',
  },
];

export default function Welcome({ onStart, onUseJob }) {
  const [jobs, setJobs] = useState([]);

  // Get the saved jobs from the backend when the page first opens
  useEffect(() => {
    api.listJobs().then(setJobs);
  }, []);

  // Load the full saved job, then App takes us to the upload step
  async function openJob(id) {
    onUseJob(await api.getJob(id));
  }

  return (
    <div className="welcome">
      <section className="hero">
        <h1>Searching through resumes one requirement at a time?</h1>
        <p className="lede">
          Tell us what the role needs, drop in the applications you’ve received, and see at a
          glance which resumes match the skills and requirements you’re looking for.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={onStart}>
            Get Started
          </button>
        </div>
      </section>

      <section className="workflow">
        <h2>How it works</h2>
        <ol className="workflow-steps">
          {WORKFLOW.map((step, i) => (
            <li key={step.title} className="workflow-step">
              <span className="workflow-num">{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              <p className="workflow-example">{step.example}</p>
            </li>
          ))}
        </ol>
        <p className="fine-print">
          Our tool finds exact words and phrases. It doesn’t score, rank or judge candidates:
          it shows you the evidence, and the decision stays yours.
        </p>
      </section>

      {jobs.length > 0 && (
        <section className="saved-jobs">
          <h2>Previously scanned jobs</h2>
          <ul>
            {jobs.map((j) => (
              <li key={j.id}>
                <button className="saved-job" onClick={() => openJob(j.id)}>
                  <span className="saved-job-title">{j.title}</span>
                  <span className="muted">{j.requirementCount} keywords</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
