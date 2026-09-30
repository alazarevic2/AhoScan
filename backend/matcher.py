# Matching rules on top of the Aho–Corasick implementation
# - ignore upper/lower case and
# - line breaks, whole words only, "manag*" = any word starting with "manag",
# - sensible handling of overlapping matches.
# A "group" is one requirement; each of its aliases is one pattern

from dataclasses import dataclass

from aho_corasick import AhoCorasick

UPPER_TO_LOWER = str.maketrans("ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz")


# One alias to search for "manag*" becomes text "manag" with stem = True
@dataclass
class PatternSpec:
    text: str
    stem: bool = False        # alias ended in '*'
    match_case: bool = False  # e.g. "IT" must be in capitals
    group_id: int = 0         # which requirement this alias belongs to


# One match that passed all the rules, with positions in the original text
@dataclass
class Occurrence:
    pattern_index: int
    group_id: int
    start: int
    end: int
    nested: bool = False      # sits inside a longer match of another requirement
    nested_in: int = -1       # pattern_index of that longer match


# Clean up an alias as the user typed it, and check if it ends in '*'
def parse_alias(alias, match_case=False, group_id=0):
    text = " ".join(alias.split())
    stem = text.endswith("*")
    if stem:
        text = text[:-1].strip()
    return PatternSpec(text, stem, match_case, group_id)


# Lowercase A-Z only. This never changes the length of the text, so positions stay correct
def ascii_lower(s):
    return s.translate(UPPER_TO_LOWER)


# Turn every run of spaces, tabs and line breaks into one space, so a phrase
# split across lines ("social\nmedia") still matches "social media"
# positions[j] remembers where collapsed[j] was in the original text, so
# matches can be mapped back afterwards
def collapse_whitespace(text):
    chars, positions = [], []
    for i, ch in enumerate(text):
        if ch.isspace():
            if chars and chars[-1] == " ":
                continue
            ch = " "
        chars.append(ch)
        positions.append(i)
    return "".join(chars), positions


# Check if text[start:end] = whole word? It must start at a word boundary, and end at
# one too unless it's a stem. A side is only checked if the pattern itself has
# a letter/digit there, so stuff like "c++" and ".net" still match
def passes_boundary(text, start, end, stem, pattern):
    if pattern[0].isalnum() and start > 0 and text[start - 1].isalnum():
        return False  # "api" inside "rapid"
    if not stem and pattern[-1].isalnum() and end < len(text) and text[end].isalnum():
        return False  # "java" inside "javascript"
    return True


# For stems: move the end of the match to the end of the word,
# so "manag" becomes "managed"
def extend_to_word_end(text, end):
    while end < len(text) and text[end].isalnum():
        end += 1
    return end


# Deal with matches that overlap:
#  - two overlapping matches of the same requirement become one match
#  - a match inside a longer match of a different requirement is flagged,
#    not counted ("API" inside "REST API")
def resolve_overlaps(occurrences):
    occurrences.sort(key=lambda o: (o.start, -o.end))

    merged = []
    for o in occurrences:
        for m in merged:
            if m.group_id == o.group_id and o.start < m.end:
                m.end = max(m.end, o.end)
                break
        else:
            merged.append(o)

    for o in merged:
        for w in merged:
            if (w.group_id != o.group_id and w.start <= o.start and o.end <= w.end
                    and w.end - w.start > o.end - o.start):
                o.nested = True
                o.nested_in = w.pattern_index
                break
    return merged


class Matcher:
    # Build one automaton that contains every alias of a job
    def __init__(self, specs):
        self.specs = specs
        self.engine = AhoCorasick()
        for i, spec in enumerate(specs):
            self.engine.add_pattern(ascii_lower(spec.text), i)
        self.engine.build()

    # Find every match in a resume's text that passes the rules above
    def scan(self, text):
        collapsed, positions = collapse_whitespace(text)
        lowered = ascii_lower(collapsed)

        found = []
        for m in self.engine.search(lowered):
            spec = self.specs[m.pattern_id]
            if not passes_boundary(lowered, m.start, m.end, spec.stem, spec.text):
                continue
            if spec.match_case and collapsed[m.start:m.end] != spec.text:
                continue
            end = extend_to_word_end(lowered, m.end) if spec.stem else m.end
            found.append(Occurrence(m.pattern_id, spec.group_id, m.start, end))

        result = resolve_overlaps(found)
        # Map the positions back to the original text
        for o in result:
            o.start = positions[o.start]
            o.end = positions[o.end - 1] + 1
        return result
