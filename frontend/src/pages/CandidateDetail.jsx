// Detail page for one resume
// Each keyword, whether it was found, and every mention shown in its sentence with the matched words highlighted

const STATE_LABEL = { found: 'Found', flagged: 'Only inside another phrase', missing: 'Not found' };

// One section ("Required" or "Nice to have") with its keywords and snippets
function RequirementGroup({ title, items }) {
  if (!items.length) return null;
  return (
    <section className="req-group">
      <h2 className="card-title">{title}</h2>
      <ul>
        {items.map((req) => (
          <li key={req.id} className={`req req-${req.state}`}>
            <div className="req-head">
              <span className="req-name">{req.name}</span>
              <span className={`req-state state-${req.state}`}>
                {STATE_LABEL[req.state]}{req.count > 1 ? ` · ${req.count} times` : ''}
              </span>
            </div>

            {req.occurrences.map((o) => (
              <blockquote key={o.start} className="snippet">
                {o.snippet[0]}<mark>{o.snippet[1]}</mark>{o.snippet[2]}
              </blockquote>
            ))}
            {req.state === 'flagged' && req.flagged.map((f) => (
              <p key={f.start} className="muted">
                “{f.matchedText}” only appears as part of “{f.insideOf}”, so it isn’t counted.
              </p>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}

// Previous and Next move between the scanned resumes
export default function CandidateDetail({ result, text, index, total, onNavigate, onBack }) {
  const { required, preferred } = result.summary;
  return (
    <div className="page">
      <div className="row row-between">
        <button className="btn btn-quiet" onClick={onBack}>All results</button>
        <div className="row">
          <button className="btn btn-small" disabled={index === 0} onClick={() => onNavigate(index - 1)}>
            Previous
          </button>
          <span className="muted">{index + 1} of {total}</span>
          <button className="btn btn-small" disabled={index === total - 1} onClick={() => onNavigate(index + 1)}>
            Next
          </button>
        </div>
      </div>

      <header className="page-head">
        <h1 className="file-title">{result.resume}</h1>
        <p className="lede">
          {required.found} of {required.total} required and {preferred.found} of {preferred.total}{' '}
          nice-to-have keywords found.
        </p>
      </header>

      <div className="card">
        <RequirementGroup title="Required" items={result.requirements.filter((r) => r.status === 'required')} />
        <RequirementGroup title="Nice to have" items={result.requirements.filter((r) => r.status === 'preferred')} />
      </div>

      <details className="card full-text">
        <summary>Show the full resume text</summary>
        <pre className="resume-text">{text}</pre>
      </details>
    </div>
  );
}
