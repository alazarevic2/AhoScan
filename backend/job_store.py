# Saves and loads jobs as JSON files in data/jobs
# Also keeps each job's Matcher in memory, so the automaton is built once per
# job instead of once per resume

import json
import re
from pathlib import Path

from models import Job
from matcher import Matcher, parse_alias


# Make a name safe to use as an id and a file name:
# "Marketing Coordinator" = "marketing-coordinator"
def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "item"


# If the name is already taken, add -2, -3, ... until it isn't
def unique(base, taken):
    name, n = base, 2
    while name in taken:
        name, n = f"{base}-{n}", n + 1
    return name


# Build one Matcher for all the aliases in a job
# group_id is the index of the requirement, so every match can be traced back to its requirement
def build_matcher(job):
    specs = [parse_alias(alias.text, alias.matchCase, group_id)
             for group_id, req in enumerate(job.requirements)
             for alias in req.aliases]
    return Matcher(specs)


class JobStore:
    # Load every saved job from the folder and build its matcher
    def __init__(self, directory):
        self.dir = Path(directory)
        self.jobs = {}    
        self.matchers = {}  
        for path in sorted(self.dir.glob("*.json")):
            job = Job.model_validate_json(path.read_text(encoding="utf-8"))
            job.id = path.stem
            self.jobs[job.id] = job
            self.matchers[job.id] = build_matcher(job)

    # Save a new job. 
    # It gets a new id, so it never overwrites another job
    def create(self, job):
        job.id = unique(slugify(job.title), self.jobs)
        return self.save(job)

    # Give every requirement an id, rebuild the job's matcher and write the file
    def save(self, job):
        ids = set()
        for req in job.requirements:
            req.id = unique(slugify(req.id or req.name), ids)
            ids.add(req.id)

        self.matchers[job.id] = build_matcher(job)
        self.jobs[job.id] = job
        self.dir.mkdir(parents=True, exist_ok=True)
        path = self.dir / f"{job.id}.json"
        path.write_text(json.dumps(job.model_dump(), indent=2), encoding="utf-8")
        return job

    # Remove a job from memory and delete its file
    def delete(self, job_id):
        del self.jobs[job_id]
        del self.matchers[job_id]
        (self.dir / f"{job_id}.json").unlink(missing_ok=True)
