from collections import deque
from dataclasses import dataclass, field

ROOT = 0

# One match: text[start:end] is the matched text
@dataclass
class Match:
    pattern_id: int
    start: int
    end: int


# One node in the trie. depth = how many characters long its string is
@dataclass
class Node:
    next: dict = field(default_factory=dict)     # character -> child node index
    fail: int = ROOT                             # failure link
    out_link: int = -1                           # nearest node on the fail chain that ends a pattern (-1 = none)
    outputs: list = field(default_factory=list)  # ids of the patterns that end at this node
    depth: int = 0


class AhoCorasick:
    # Start with just the root node
    def __init__(self):
        self.nodes = [Node()]
        self.built = False

    # Add one pattern to the trie, making new nodes for any characters that
    # aren't there yet. The pattern's id is stored on its last node
    def add_pattern(self, pattern, pattern_id):
        if self.built:
            raise RuntimeError("add_pattern called after build()")
        if not pattern:
            raise ValueError("empty pattern")

        node = ROOT
        for ch in pattern:
            if ch not in self.nodes[node].next:
                self.nodes.append(Node(depth=self.nodes[node].depth + 1))
                self.nodes[node].next[ch] = len(self.nodes) - 1
            node = self.nodes[node].next[ch]
        self.nodes[node].outputs.append(pattern_id)

    # Work out every node's failure link and output link
    def build(self):
        nodes = self.nodes
        # Go level by level (breadth-first). fail(v) is always shallower than
        # v, so it has already been worked out by the time v needs it
        # The root's children keep fail = ROOT.
        queue = deque(nodes[ROOT].next.values())

        while queue:
            u = queue.popleft()
            for ch, v in nodes[u].next.items():
                # Start from u's failure link and keep falling back until we
                # find a node that has a ch child 
                f = nodes[u].fail
                while f != ROOT and ch not in nodes[f].next:
                    f = nodes[f].fail
                fail = nodes[f].next.get(ch, ROOT)
                nodes[v].fail = fail

                # Output link: if the fail node ends a pattern, point at it,
                # otherwise borrow its output link
                nodes[v].out_link = fail if nodes[fail].outputs else nodes[fail].out_link
                queue.append(v)

        self.built = True

    # Scan the text once and return every match of every pattern, including
    # overlapping ones, in the order they end
    def search(self, text):
        if not self.built:
            raise RuntimeError("search called before build()")
        nodes = self.nodes
        matches = []
        state = ROOT

        for i, ch in enumerate(text):
            # If there's no ch edge from here, fall back along failure links
            # until there is one (or we're back at the root)
            while state != ROOT and ch not in nodes[state].next:
                state = nodes[state].fail
            state = nodes[state].next.get(ch, ROOT)

            # Every pattern that ends at position i is on the fail chain of
            # state. Output links jump straight to the ones that end a pattern
            node = state if nodes[state].outputs else nodes[state].out_link
            while node != -1:
                for pattern_id in nodes[node].outputs:
                    # Use this node's depth, not state's, because it can be a
                    # shorter pattern that ends at the same place
                    matches.append(Match(pattern_id, i + 1 - nodes[node].depth, i + 1))
                node = nodes[node].out_link

        return matches
