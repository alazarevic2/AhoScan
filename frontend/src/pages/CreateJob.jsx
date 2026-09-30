// Step 1: the employer types the job title and the keywords to look for
// Saves a new job, or updates the current one if they came back to edit it.
import { useState } from 'react';
import { api } from '../client.js';

// Turn whatever was typed or pasted into a list of keywords:
function parseKeywords(input) {
  return input
    .split(/[\n,;]+/) // split on new lines, commas, semicolons
    .map((line) => line.replace(/^[\s•\-–]+/, '').trim()) // remove pasted bullet points
    .filter(Boolean) // skip empty lines
    .map((line) => {
      // " / " with spaces around it separates alternatives, so "C/C++" stays one keyword
      const texts = line.split(/\s+\/\s+/);
      return { name: texts[0], status: 'required', aliases: texts.map((text) => ({ text })) };
    });
}

// The text shown on a keyword's chip, e.g. "SEO / search engine optimi*"
const keywordLabel = (k) => k.aliases.map((a) => a.text).join(' / ');

export default function CreateJob({ job, onSaved }) {
  const [title, setTitle] = useState(job?.title ?? '');
  const [keywords, setKeywords] = useState(job?.requirements ?? []);
  const [draft, setDraft] = useState('');   // what's currently typed in the keywords box
  const [error, setError] = useState('');

  // The keyword list plus anything still in the text box, skipping duplicates
  // (not case sensitive, so "Excel" and "excel" count as the same).
  function withDraft() {
    const all = [...keywords];
    for (const k of parseKeywords(draft)) {
      const label = keywordLabel(k).toLowerCase();
      if (!all.some((a) => keywordLabel(a).toLowerCase() === label)) all.push(k);
    }
    return all;
  }

  // Turn what's in the text box into chips and clear the box
  function addKeywords() {
    setKeywords(withDraft());
    setDraft('');
  }

  // Clicking a chip switches it between required and nice to have
  function toggle(i) {
    setKeywords(keywords.map((k, j) =>
      j === i ? { ...k, status: k.status === 'required' ? 'preferred' : 'required' } : k));
  }

  // Check the form, save the job to the backend, move to the upload step
  async function save(e) {
    e.preventDefault();
    const requirements = withDraft();
    if (!title.trim()) return setError('Give the job a title.');
    if (!requirements.length) return setError('Add at least one keyword to look for.');
    try {
      const body = { title: title.trim(), requirements };
      onSaved(job ? await api.updateJob({ ...body, id: job.id }) : await api.createJob(body));
    } catch (err) {
      setError(err.message);
    }
  }

  const required = keywords.filter((k) => k.status === 'required').length;

  return (
    <form className="page" onSubmit={save}>
      <header className="page-head">
        <p className="eyebrow">Step 1 of 3</p>
        <h1>{job ? 'Edit the job' : 'What are you hiring for?'}</h1>
        <p className="lede">
          Name the role, then list what a good resume should mention. You can paste straight
          from your job ad.
        </p>
      </header>

      <div className="card">
        <label className="field">
          <span className="field-label">Job title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Creative Director"
          />
        </label>

        <label className="field">
          <span className="field-label">Keywords to look for</span>
          <span className="field-help">Separate with commas or new lines & press Enter to add them.</span>
          <textarea
            rows={4}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter adds the keywords (shift + enter makes newline)
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                addKeywords();
              }
            }}
            placeholder={'e.g. Adobe Creative Cloud, Trello, Canva\nGoogle Analytics\nCampaign manag*'}
          />
        </label>
        <div className="row">
          <button type="button" className="btn" onClick={addKeywords} disabled={!draft.trim()}>
            Add keywords
          </button>
          <details className="tips">
            <summary>Tips for better matches</summary>
            <ul>
              <li><b>Alternatives:</b> other ways a candidate might write the same skill. For example, "Customer service" could also be written as "customer support" or "client service", so add all three.</li>
              <li><b>Word endings:</b> put a * at the end to match any ending. For example, "manag*" finds managed, manager and managing.</li>
              <li><b>Whole words only:</b> "Java" won't match inside "JavaScript". Capital letters and line breaks don't matter.</li>
            </ul>
          </details>
        </div>

        {keywords.length > 0 && (
          <div className="keywords">
            <p className="field-help">
              {required} required · {keywords.length - required} nice to have. Click a keyword to
              switch between the two.
            </p>
            <ul className="chips">
              {keywords.map((k, i) => (
                <li key={keywordLabel(k)} className={`chip ${k.status === 'required' ? 'chip-required' : 'chip-nice'}`}>
                  <button type="button" className="chip-toggle" onClick={() => toggle(i)}>
                    <span className="chip-kind">{k.status === 'required' ? 'Required' : 'Nice to have'}</span>
                    {keywordLabel(k)}
                  </button>
                  <button
                    type="button"
                    className="chip-remove"
                    onClick={() => setKeywords(keywords.filter((_, j) => j !== i))}
                    aria-label={`Remove ${k.name}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {error && <p className="banner banner-error">{error}</p>}

      <div className="page-actions">
        <button type="submit" className="btn btn-primary btn-lg">Continue to upload</button>
      </div>
    </form>
  );
}
