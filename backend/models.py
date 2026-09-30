# The shape of the JSON the frontend sends

from typing import Literal
from pydantic import BaseModel


# One way of writing a keyword
class Alias(BaseModel):
    text: str
    matchCase: bool = False


# One keyword the employer is looking for, with alternatives
class Requirement(BaseModel):
    id: str = ""
    name: str
    status: Literal["required", "preferred"] = "required"
    aliases: list[Alias]


# A job - a title and its keyword
class Job(BaseModel):
    id: str = ""
    title: str
    requirements: list[Requirement]


# One resume - the file name and the text taken out of it
class Resume(BaseModel):
    name: str
    text: str


# What the frontend sends to scan - a list of resumes
class ScanRequest(BaseModel):
    resumes: list[Resume]


# Checks that a job makes sense
# Returns error message for the user
def validate_job(job):
    if not job.title.strip():
        return "Job title is empty"
    if not job.requirements:
        return "Add at least one keyword"
    for req in job.requirements:
        if not req.name.strip() or not req.aliases:
            return "Every keyword needs a name and at least one alias"
        for alias in req.aliases:
            if not alias.text.strip(" *"):
                return f"Keyword '{req.name}' has an empty alias"
    return None
