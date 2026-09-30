// Talks to the backend. One function for each route in backend/app.py

// Send a request to the backend and return its JSON reply
// If the backend sends back an error, throw it so the page can show it
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // FastAPI puts the error message in "detail"
    throw new Error(typeof body.detail === 'string' ? body.detail : `Request failed (${res.status})`);
  }
  return body;
}

// Request options for sending data as JSON
function sendJson(method, data) {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
}

export const api = {
  listJobs: () => request('/jobs'),
  getJob: (id) => request(`/jobs/${id}`),
  createJob: (job) => request('/jobs', sendJson('POST', job)),
  updateJob: (job) => request(`/jobs/${job.id}`, sendJson('PUT', job)),
  deleteJob: (id) => request(`/jobs/${id}`, { method: 'DELETE' }),
  scan: (jobId, resumes) => request(`/jobs/${jobId}/scan`, sendJson('POST', { resumes })),

  // Upload resume files - the backend reads them and sends back their text
  extract: (files) => {
    const form = new FormData();
    for (const file of files) form.append('files', file);
    return request('/extract', { method: 'POST', body: form });
  },
};
