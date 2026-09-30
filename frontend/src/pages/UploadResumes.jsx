// Step 2: the employer drags and drops resumes (or clicks to browse for them).
// The files are sent to the backend, which reads the text out of them.
import { useState } from 'react';
import { api } from '../client.js';
import uploadIcon from '../upload-icon.png';

export default function UploadResumes({ job, resumes, setResumes, onScan, onEditJob }) {
  const [dragging, setDragging] = useState(false); // true while files are dragged over the box
  const [busy, setBusy] = useState(false);         // true while reading files or scanning
  const [errors, setErrors] = useState([]);

  // Send the files to the backend to be read, then add them to the list
  // A file with the same name as one already in the list replaces it
  async function addFiles(fileList) {
    const files = [...fileList]; // copy straight away: the browser empties the original list after the drop
    setBusy(true);
    try {
      const data = await api.extract(files);
      setResumes((prev) => [...prev.filter((r) => !data.resumes.some((a) => a.name === r.name)), ...data.resumes]);
      setErrors(data.errors);
    } catch (e) {
      setErrors([e.message]);
    }
    setBusy(false);
  }

  // Start the scan - show the results page when done
  async function scan() {
    setBusy(true);
    try {
      await onScan();
    } catch (e) {
      setErrors([e.message]);
      setBusy(false);
    }
  }

  const required = job.requirements.filter((r) => r.status === 'required').length;
  const count = `${resumes.length} resume${resumes.length === 1 ? '' : 's'}`;

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Step 2 of 3</p>
        <h1>Upload the resumes you’ve received</h1>
        <p className="lede">
          Scanning for <b>{job.title}</b>: {required} required and{' '}
          {job.requirements.length - required} nice-to-have keywords.{' '}
          <button className="link" onClick={onEditJob}>Edit keywords</button>
        </p>
      </header>

      <label
        className={`dropzone ${dragging ? 'is-dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
      >
        <img className="dropzone-icon" src={uploadIcon} alt="" />
        <span className="dropzone-title">{busy ? 'Reading files…' : 'Drag and drop resumes here'}</span>
        <span className="muted">
          or <span className="link">browse your files</span>. Select as many as you like: PDF, DOCX or TXT.
        </span>
        <input
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          hidden
          // Clearing the value lets you pick the same file again later
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        />
      </label>

      {errors.map((e) => <p key={e} className="banner banner-error">{e}</p>)}

      {resumes.length > 0 && (
        <div className="card file-list-card">
          <div className="row row-between">
            <h2 className="card-title">{count} ready</h2>
            <button className="btn btn-quiet" onClick={() => setResumes([])}>Remove all</button>
          </div>
          <ul className="file-list">
            {resumes.map((r) => (
              <li key={r.name} className="file">
                <span className="file-ext">{r.name.split('.').pop()}</span>
                <span className="file-name">{r.name}</span>
                <span className="muted">{r.text.length.toLocaleString()} characters</span>
                <button
                  className="btn btn-quiet btn-icon"
                  onClick={() => setResumes(resumes.filter((x) => x !== r))}
                  aria-label={`Remove ${r.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="page-actions">
        <button className="btn btn-primary btn-lg" disabled={!resumes.length || busy} onClick={scan}>
          {resumes.length ? `Scan ${count}` : 'Add resumes to scan'}
        </button>
      </div>
    </div>
  );
}
