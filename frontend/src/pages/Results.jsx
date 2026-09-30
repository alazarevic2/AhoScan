// Step 3: the results
// First a summary of how many resumes mention each keyword, then one row
// per resume (in the order they were uploaded)

import { useState } from 'react';

// Small dots, one per keyword. A filled dot means that keyword was found
function Dots({ reqs }) {
  return (
    <span className="dots" aria-hidden="true">
      {reqs.map((r) => <span key={r.id} className={`dot dot-${r.state}`} />)}
    </span>
  );
}

// The checkbox hides resumes that are missing a required keyword
export default function Results({ job, results, onOpen, onAddMore, onStartOver, onDeleteJob }) {
  const [onlyComplete, setOnlyComplete] = useState(false);

  // True if the resume mentions every required keyword
  const hasAllRequired = (r) => r.summary.required.found === r.summary.required.total;
  const completeCount = results.filter(hasAllRequired).length;

  return (
    <div className="page page-wide">
      <header className="page-head">
        <p className="eyebrow">Step 3 of 3</p>
        <h1>Results for {job.title}</h1>
        <p className="lede">
          {completeCount} of {results.length} resume{results.length === 1 ? '' : 's'} mention every
          required keyword. Open a resume to read each mention in context.
        </p>
      </header>

      <div className="card">
        <h2 className="card-title">Keywords across all resumes</h2>
        <ul className="coverage">
          {job.requirements.map((req, k) => {
            // How many resumes found this keyword (requirement k in every result)
            const found = results.filter((r) => r.requirements[k].state === 'found').length;
            return (
              <li key={req.id} className="coverage-item">
                <span className="coverage-name">
                  {req.name}
                  {req.status === 'preferred' && <span className="tag">nice to have</span>}
                </span>
                <span className="coverage-bar">
                  <span style={{ width: `${(100 * found) / results.length}%` }} />
                </span>
                <span className="coverage-count">{found} / {results.length}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="row row-between results-toolbar">
        <label className="checkbox">
          <input type="checkbox" checked={onlyComplete} onChange={(e) => setOnlyComplete(e.target.checked)} />
          Only show resumes with every required keyword
        </label>
        <button className="btn" onClick={onAddMore}>Add more resumes</button>
      </div>

      <div className="table-wrap">
        <table className="results">
          <thead>
            <tr>
              <th>Resume</th>
              <th>Required</th>
              <th>Nice to have</th>
              <th>Missing required</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => {
              if (onlyComplete && !hasAllRequired(r)) return null; // hidden by the checkbox
              const required = r.requirements.filter((q) => q.status === 'required');
              const preferred = r.requirements.filter((q) => q.status === 'preferred');
              const missing = required.filter((q) => q.state !== 'found');
              return (
                <tr key={r.resume}>
                  <td className="cell-name">{r.resume}</td>
                  <td><Dots reqs={required} />{r.summary.required.found} / {r.summary.required.total}</td>
                  <td><Dots reqs={preferred} />{r.summary.preferred.found} / {r.summary.preferred.total}</td>
                  <td>
                    {missing.length === 0
                      ? <span className="ok">None</span>
                      : missing.map((q) => <span key={q.id} className="tag tag-missing">{q.name}</span>)}
                  </td>
                  <td className="cell-action">
                    <button className="btn btn-small" onClick={() => onOpen(i)}>View</button>
                  </td>
                </tr>
              );
            })}
            {onlyComplete && completeCount === 0 && (
              <tr><td colSpan={5} className="empty">No resume mentions every required keyword.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="row row-between">
        <button className="btn" onClick={onStartOver}>Back to start</button>
        <button className="btn btn-danger" onClick={onDeleteJob}>Delete this job</button>
      </div>
    </div>
  );
}
