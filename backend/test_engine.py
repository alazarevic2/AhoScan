# Tests for the Aho–Corasick engine. Run with "pytest" from this folder.
# Each test says what goes in and what the engine should give back.
# Positions are start-end with the end not included, so "he" at 2-4 means text[2:4].

import random

import pytest

from aho_corasick import AhoCorasick


# Helper: build an automaton where pattern i gets id i
def make(patterns):
    ac = AhoCorasick()
    for i, p in enumerate(patterns):
        ac.add_pattern(p, i)
    ac.build()
    return ac


# Helper: matches as a set of (id, start, end), so the order doesn't matter
def as_set(matches):
    return {(m.pattern_id, m.start, m.end) for m in matches}


# Helper: the slow but obviously correct answer (try every pattern at every position)
def brute_force(patterns, text):
    return {(i, s, s + len(p))
            for i, p in enumerate(patterns)
            for s in range(len(text) - len(p) + 1)
            if text[s:s + len(p)] == p}


# patterns: he, she, his, hers
# text:     "ushers"
# expect:   she at 1-4, he at 2-4, hers at 2-6 (his is not in the text)
def test_classic_ushers():
    ac = make(["he", "she", "his", "hers"])
    assert as_set(ac.search("ushers")) == {(1, 1, 4), (0, 2, 4), (3, 2, 6)}


# patterns: rest api, api
# text:     "built rest api services"
# expect:   rest api at 6-14, api at 11-14
# note:     api ends where rest api ends, so it's only found through the output
#           link. Deleting the out_link line in build() makes this test fail.
def test_suffix_pattern_needs_output_links():
    ac = make(["rest api", "api"])
    assert as_set(ac.search("built rest api services")) == {(0, 6, 14), (1, 11, 14)}


# patterns: a, aa, aaa
# text:     "aaaa"
# expect:   9 matches (a 4 times, aa 3 times, aaa 2 times)
def test_repeated_and_nested():
    assert len(make(["a", "aa", "aaa"]).search("aaaa")) == 4 + 3 + 2


# patterns: xyz
# text:     "" and "abcabc"
# expect:   no matches for either
def test_no_match_and_empty_text():
    ac = make(["xyz"])
    assert ac.search("") == []
    assert ac.search("abcabc") == []


# patterns: customer service, café
# text:     "great customer service at the café"
# expect:   both found, and cutting the text at their positions gives back
#           exactly "customer service" and "café" (so "é" doesn't shift anything)
def test_multi_word_and_non_ascii():
    ac = make(["customer service", "café"])
    text = "great customer service at the café"
    found = as_set(ac.search(text))
    assert len(found) == 2
    assert {text[s:e] for _, s, e in found} == {"customer service", "café"}


# patterns: seo, seo (the same pattern twice, with ids 0 and 1)
# text:     "seo"
# expect:   2 matches, one for each id
def test_duplicate_patterns_both_reported():
    assert len(make(["seo", "seo"]).search("seo")) == 2


# pattern:  "" (empty)
# expect:   add_pattern refuses it with a ValueError
def test_empty_pattern_rejected():
    with pytest.raises(ValueError):
        AhoCorasick().add_pattern("", 0)


# patterns: 1 to 8 random words made of a, b (and sometimes c), 1 to 5 letters long
# text:     a random string of the same letters, up to 60 letters long
# repeat:   3,000 times
# expect:   exactly the same matches as the brute-force search every time
#           (tiny alphabets mean lots of overlapping matches to get right)
def test_random_against_brute_force():
    rng = random.Random(42)
    for _ in range(3000):
        alphabet = rng.choice(["ab", "abc"])
        word = lambda n: "".join(rng.choice(alphabet) for _ in range(n))
        patterns = [word(rng.randint(1, 5)) for _ in range(rng.randint(1, 8))]
        text = word(rng.randint(0, 60))
        assert as_set(make(patterns).search(text)) == brute_force(patterns, text), text
