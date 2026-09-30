# Builds the result for one resume - for each requirement, whether it was found
# and where (with a snippet of the text around it), plus found/total counts

import re


# The words around text[start:end], returned as [before, match, after] so the
# frontend can highlight the match. Only cuts at spaces, so no word is split,
# and adds "…" where the text was cut
def snippet(text, start, end, radius=60):
    left = max(0, start - radius)
    while 0 < left < start and not text[left - 1].isspace():
        left += 1
    right = min(len(text), end + radius)
    while end < right < len(text) and not text[right].isspace():
        right -= 1

    # Turn line breaks and repeated spaces into single spaces
    def tidy(s):
        return re.sub(r"\s+", " ", s)

    before = ("…" if left > 0 else "") + tidy(text[left:start]).lstrip()
    after = tidy(text[end:right]).rstrip() + ("…" if right < len(text) else "")
    return [before, tidy(text[start:end]), after]


# Scan one resume and sort its matches into the job's requirements
def scan_resume(job, matcher, name, text):
    # Pattern i in the matcher is the i-th alias, in job order
    aliases = [alias.text for req in job.requirements for alias in req.aliases]

    requirements = [
        {"id": req.id, "name": req.name, "status": req.status,
         "state": "missing", "count": 0, "occurrences": [], "flagged": []}
        for req in job.requirements
    ]

    for occ in matcher.scan(text):
        req = requirements[occ.group_id]
        hit = {"start": occ.start, "end": occ.end, "matchedText": text[occ.start:occ.end]}
        if occ.nested:
            hit["insideOf"] = aliases[occ.nested_in]
            req["flagged"].append(hit)
        else:
            hit["snippet"] = snippet(text, occ.start, occ.end)
            req["occurrences"].append(hit)

    # Work out each requirement's state and the found/total counts
    summary = {"required": {"found": 0, "total": 0}, "preferred": {"found": 0, "total": 0}}
    for req in requirements:
        req["count"] = len(req["occurrences"])
        if req["count"]:
            req["state"] = "found"
        elif req["flagged"]:
            req["state"] = "flagged"
        summary[req["status"]]["total"] += 1
        if req["state"] == "found":
            summary[req["status"]]["found"] += 1

    return {"resume": name, "summary": summary, "requirements": requirements}
