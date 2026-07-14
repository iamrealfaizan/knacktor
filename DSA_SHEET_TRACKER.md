# Knacktor — DSA Sheet Coverage Tracker

**Purpose.** A prioritized, committable tracker of LeetCode problems to author into Knacktor, ranked so
that adding the top of the list banks membership in the most popular DSA sheets per problem. Add
**top-down** (Tier 4 → Tier 1) to maximize sheet coverage fastest.

**Scope.** Easy + Medium only (Hard omitted by design — see note at bottom). Every row is a real LeetCode
problem. Compiled from the canonical sheet rosters (sources at bottom), cross-referenced on _2026-07-06_.
Membership for **Top Interview 150 (T)** and **Grind 75 (G)** can shift slightly over time — verify at
authoring time (the `add-problem-staged` pipeline sources from LeetCode directly anyway).

## Legend

**Sheets** (which popular lists a problem appears in) → **Overlap** = how many of the four:
`B` = Blind 75 · `N` = NeetCode 150 · `T` = LeetCode Top Interview 150 · `G` = Grind 75.

**Renderer** = the Knacktor generic primitive that fits (`array`, `bar-container`, `hashmap`, `stack`,
`queue`, `tree`, `linkedList`, `grid`, `graph`, `recursion`).

**Engine change** (what's needed beyond authoring):
- `—` Addable now with an existing renderer.
- `🆕 heap` No Heap/Priority-Queue renderer exists — needs a one-time engine build. *(Most also have an
  array/hashmap alternative — e.g. bucket-sort / quickselect / Floyd — that IS addable now.)*
- `🆕 bit` No bit-manipulation renderer — build one or model bits via the `array` renderer (borderline fidelity).
- `🆕 custom` Needs a bespoke component (D17), e.g. LRU Cache = hashmap + doubly-linked list coordination.
- `⛔ DEFER` Current primitives can't honestly show the unit of work (per `rules/FidelityReview.md`).

**On LC** = present on LeetCode: `Yes` / `🔒Prem` (exists but LeetCode Premium-locked).

**Status** = `✅` already in our system · `⬜` to add.

---

## Coverage summary

| | Tier 4 (all 4) | Tier 3 (3 of 4) | Tier 2 (2 of 4) | Tier 1 (1 of 4) |
|---|---|---|---|---|
| In system | 31 | 5 | 2 | 3 |
| To add | 1 | 20 | ~40 | ~70 |

_Reconciled against the live `seeds/problems/` directory on 2026-07-07: 26 problems present. Tier-4 in-system rose from 10 → 15 (#3, #15, #33, #238, #242 authored); #217 added to Tier 2; #167 and #695 added to Tier 1 (NeetCode-only)._

_Update 2026-07-08: #226 Invert Binary Tree authored (recursive-DFS + BFS-queue, `tree`/`tree`+`queue`) — Tier-4 in-system 15 → 18 (the count also now reflects #141 and #230, already shipped)._

_Update 2026-07-08: #70 Climbing Stairs authored (brute recursion + bottom-up DP) — Tier-4 in-system 18 → 19. **NOTE:** the brute force renders on the `tree` renderer, not the dedicated `recursion` renderer. `recursion` is still UNPROVEN: `mapRecursion` feeds one `frames` array to both the call-stack panel and the recursion-tree panel, which can't honestly show a live stack + an accumulated tree at once. Fixing it (separate live-stack vs. accumulated-tree data) is a one-time engine task before any problem uses that renderer._

_Update 2026-07-12: reconciled against the **live MongoDB** (`knacktor.problems` = 44 docs). Ten Tier-4 rows that were live in the DB but still marked ⬜ flipped to ✅: #5, #39, #54, #56, #57, #79, #133, #139, #322, and #104 (Maximum Depth of Binary Tree — authored this session, recursive-DFS + iterative-BFS on `tree`/`tree`+`queue`). **Tier-4 in-system 19 → 30; #98 Validate BST authored this session too (3 approaches: brute-force min/max scans + DFS bounds + inorder, all `tree`). #105 Construct Binary Tree also authored (2 approaches: hashmap+boundaries optimal + linear-search+slicing brute, `tree` primary + preorder/inorder aux arrays). Only 1 Tier-4 problem remains: #208 Implement Trie.** NOTE: #39 Combination Sum's row lists the `recursion` renderer, but per the UNPROVEN-recursion caveat it was almost certainly authored on `tree` — verify at `/problems/combination-sum`._

Add order that fills the most sheets fastest: **Tier 4 → Tier 3 → Tier 2 → Tier 1.** The 3 remaining
to-add problems in Tier 4 each count toward **all four** sheets — do them first.

---

## Tier 4 — appears in ALL 4 sheets (highest priority)

| # | Problem | Diff | Topic | Sheets | Ov | Renderer | Engine change | On LC | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Two Sum | Easy | Array / Hash | B N T G | 4 | hashmap | — | Yes | ✅ |
| 20 | Valid Parentheses | Easy | Stack | B N T G | 4 | stack | — | Yes | ✅ |
| 21 | Merge Two Sorted Lists | Easy | Linked List | B N T G | 4 | linkedList | — | Yes | ✅ |
| 121 | Best Time to Buy and Sell Stock | Easy | Array | B N T G | 4 | array | — | Yes | ✅ |
| 125 | Valid Palindrome | Easy | Two Pointers | B N T G | 4 | array | — | Yes | ✅ |
| 11 | Container With Most Water | Medium | Two Pointers | B N T G | 4 | bar-container | — | Yes | ✅ |
| 53 | Maximum Subarray | Medium | DP / Greedy | B N T G | 4 | array | — | Yes | ✅ |
| 102 | Binary Tree Level Order Traversal | Medium | Tree (BFS) | B N T G | 4 | tree | — | Yes | ✅ |
| 200 | Number of Islands | Medium | Graph | B N T G | 4 | grid | — | Yes | ✅ |
| 207 | Course Schedule | Medium | Graph (topo) | B N T G | 4 | graph | — | Yes | ✅ |
| 242 | Valid Anagram | Easy | Hash | B N T G | 4 | hashmap | — | Yes | ✅ |
| 3 | Longest Substring Without Repeating Chars | Medium | Sliding Window | B N T G | 4 | array | — | Yes | ✅ |
| 15 | 3Sum | Medium | Two Pointers | B N T G | 4 | array | — | Yes | ✅ |
| 238 | Product of Array Except Self | Medium | Array | B N T G | 4 | array | — | Yes | ✅ |
| 33 | Search in Rotated Sorted Array | Medium | Binary Search | B N T G | 4 | array | — | Yes | ✅ |
| 5 | Longest Palindromic Substring | Medium | DP / String | B N T G | 4 | array | — | Yes | ✅ |
| 70 | Climbing Stairs | Easy | DP (1-D) | B N T G | 4 | recursion | — | Yes | ✅ |
| 322 | Coin Change | Medium | DP (1-D) | B N T G | 4 | array | — | Yes | ✅ |
| 139 | Word Break | Medium | DP (1-D) | B N T G | 4 | array | — | Yes | ✅ |
| 39 | Combination Sum | Medium | Backtracking | B N T G | 4 | recursion | — | Yes | ✅ |
| 56 | Merge Intervals | Medium | Interval | B N T G | 4 | array | — | Yes | ✅ |
| 57 | Insert Interval | Medium | Interval | B N T G | 4 | array | — | Yes | ✅ |
| 54 | Spiral Matrix | Medium | Matrix | B N T G | 4 | grid | — | Yes | ✅ |
| 79 | Word Search | Medium | Backtracking / Matrix | B N T G | 4 | grid | — | Yes | ✅ |
| 133 | Clone Graph | Medium | Graph | B N T G | 4 | graph | — | Yes | ✅ |
| 141 | Linked List Cycle | Easy | Linked List | B N T G | 4 | linkedList | — | Yes | ✅ |
| 226 | Invert Binary Tree | Easy | Tree | B N T G | 4 | tree | — | Yes | ✅ |
| 104 | Maximum Depth of Binary Tree | Easy | Tree | B N T G | 4 | tree | — | Yes | ✅ |
| 98 | Validate Binary Search Tree | Medium | BST | B N T G | 4 | tree | — | Yes | ✅ |
| 230 | Kth Smallest Element in a BST | Medium | BST | B N T G | 4 | tree | — | Yes | ✅ |
| 105 | Construct Binary Tree (Preorder+Inorder) | Medium | Tree | B N T G | 4 | tree | — | Yes | ✅ |
| 208 | Implement Trie (Prefix Tree) | Medium | Trie | B N T G | 4 | tree | — | Yes | ⬜ |

## Tier 3 — appears in 3 of 4 sheets

| # | Problem | Diff | Topic | Sheets | Ov | Renderer | Engine change | On LC | Status |
|---|---|---|---|---|---|---|---|---|---|
| 206 | Reverse Linked List | Easy | Linked List | B N G | 3 | linkedList | — | Yes | ✅ |
| 49 | Group Anagrams | Medium | Hash | B N T | 3 | hashmap | — | Yes | ✅ |
| 128 | Longest Consecutive Sequence | Medium | Hash | B N T | 3 | array | — | Yes | ✅ |
| 48 | Rotate Image | Medium | Matrix | B N T | 3 | grid | — | Yes | ✅ |
| 73 | Set Matrix Zeroes | Medium | Matrix | B N T | 3 | grid | — | Yes | ⬜ |
| 153 | Find Minimum in Rotated Sorted Array | Medium | Binary Search | B N T | 3 | array | — | Yes | ✅ |
| 100 | Same Tree | Easy | Tree | B N T | 3 | tree | — | Yes | ✅ |
| 235 | Lowest Common Ancestor of a BST | Medium | BST | B N G | 3 | tree | — | Yes | ⬜ |
| 199 | Binary Tree Right Side View | Medium | Tree (BFS) | N T G | 3 | tree | — | Yes | ⬜ |
| 211 | Design Add and Search Words | Medium | Trie | B N T | 3 | tree | — | Yes | ⬜ |
| 155 | Min Stack | Medium | Stack | N T G | 3 | stack | — | Yes | ⬜ |
| 150 | Evaluate Reverse Polish Notation | Medium | Stack | N T G | 3 | stack | — | Yes | ⬜ |
| 143 | Reorder List | Medium | Linked List | B N T | 3 | linkedList | — | Yes | ✅ |
| 19 | Remove Nth Node From End of List | Medium | Linked List | B N T | 3 | linkedList | — | Yes | ✅ |
| 146 | LRU Cache | Medium | Design | N T G | 3 | (hashmap+list) | 🆕 custom | Yes | ⬜ |
| 55 | Jump Game | Medium | Greedy / DP | B N T | 3 | array | — | Yes | ⬜ |
| 198 | House Robber | Medium | DP (1-D) | B N T | 3 | array | — | Yes | ⬜ |
| 91 | Decode Ways | Medium | DP (1-D) | B N T | 3 | array | — | Yes | ⬜ |
| 300 | Longest Increasing Subsequence | Medium | DP (1-D) | B N T | 3 | array | — | Yes | ⬜ |
| 62 | Unique Paths | Medium | DP (2-D) | B N G | 3 | grid | — | Yes | ⬜ |
| 78 | Subsets | Medium | Backtracking | N T G | 3 | recursion | — | Yes | ⬜ |
| 46 | Permutations | Medium | Backtracking | N T G | 3 | recursion | — | Yes | ⬜ |
| 17 | Letter Combinations of a Phone Number | Medium | Backtracking | N T G | 3 | recursion | — | Yes | ⬜ |
| 191 | Number of 1 Bits | Easy | Bit | B N T | 3 | (array) | 🆕 bit | Yes | ⬜ |
| 338 | Counting Bits | Easy | Bit | B N T | 3 | (array) | 🆕 bit | Yes | ⬜ |
| 190 | Reverse Bits | Easy | Bit | B N T | 3 | (array) | 🆕 bit | Yes | ⬜ |

## Tier 2 — appears in 2 of 4 sheets

| # | Problem | Diff | Topic | Sheets | Ov | Renderer | Engine change | On LC | Status |
|---|---|---|---|---|---|---|---|---|---|
| 994 | Rotting Oranges | Medium | Graph (BFS) | N G | 2 | grid | — | Yes | ✅ |
| 217 | Contains Duplicate | Easy | Array / Hash | B N | 2 | hashmap | — | Yes | ✅ |
| 424 | Longest Repeating Character Replacement | Medium | Sliding Window | B N | 2 | array | — | Yes | ⬜ |
| 152 | Maximum Product Subarray | Medium | DP | B N | 2 | array | — | Yes | ⬜ |
| 213 | House Robber II | Medium | DP (1-D) | B N | 2 | array | — | Yes | ⬜ |
| 647 | Palindromic Substrings | Medium | DP | B N | 2 | array | — | Yes | ⬜ |
| 1143 | Longest Common Subsequence | Medium | DP (2-D) | B N | 2 | grid | — | Yes | ⬜ |
| 417 | Pacific Atlantic Water Flow | Medium | Graph | B N | 2 | grid | — | Yes | ⬜ |
| 435 | Non-overlapping Intervals | Medium | Interval | B N | 2 | array | — | Yes | ⬜ |
| 268 | Missing Number | Easy | Bit / Array | B N | 2 | array | — | Yes | ⬜ |
| 371 | Sum of Two Integers | Medium | Bit | B N | 2 | (array) | 🆕 bit | Yes | ⬜ |
| 252 | Meeting Rooms | Easy | Interval | B N | 2 | array | — | 🔒Prem | ⬜ |
| 253 | Meeting Rooms II | Medium | Interval | B N | 2 | array | — | 🔒Prem | ⬜ |
| 261 | Graph Valid Tree | Medium | Graph / Union-Find | B N | 2 | graph | — | 🔒Prem | ⬜ |
| 323 | Number of Connected Components | Medium | Graph / Union-Find | B N | 2 | graph | — | 🔒Prem | ⬜ |
| 271 | Encode and Decode Strings | Medium | String | B N | 2 | array | — | 🔒Prem | ⬜ |
| 2 | Add Two Numbers | Medium | Linked List | N T | 2 | linkedList | — | Yes | ⬜ |
| 138 | Copy List with Random Pointer | Medium | Linked List | N T | 2 | linkedList | — | Yes | ⬜ |
| 210 | Course Schedule II | Medium | Graph (topo) | N T | 2 | graph | — | Yes | ⬜ |
| 130 | Surrounded Regions | Medium | Graph | N T | 2 | grid | — | Yes | ⬜ |
| 22 | Generate Parentheses | Medium | Backtracking | N T | 2 | recursion | — | Yes | ⬜ |
| 74 | Search a 2D Matrix | Medium | Binary Search | N T | 2 | grid | — | Yes | ⬜ |
| 36 | Valid Sudoku | Medium | Matrix / Hash | N T | 2 | grid | — | Yes | ⬜ |
| 45 | Jump Game II | Medium | Greedy | N T | 2 | array | — | Yes | ⬜ |
| 134 | Gas Station | Medium | Greedy | N T | 2 | array | — | Yes | ⬜ |
| 97 | Interleaving String | Medium | DP (2-D) | N T | 2 | grid | — | Yes | ⬜ |
| 72 | Edit Distance | Medium | DP (2-D) | N T | 2 | grid | — | Yes | ⬜ |
| 221 | Maximal Square | Medium | DP (2-D) | N T | 2 | grid | — | Yes | ⬜ |
| 136 | Single Number | Easy | Bit | N T | 2 | (array) | 🆕 bit | Yes | ⬜ |
| 66 | Plus One | Easy | Math / Array | N T | 2 | array | — | Yes | ⬜ |
| 50 | Pow(x, n) | Medium | Math / Recursion | N T | 2 | recursion | — | Yes | ⬜ |
| 202 | Happy Number | Easy | Hash / Math | N T | 2 | hashmap | — | Yes | ⬜ |
| 215 | Kth Largest Element in an Array | Medium | Heap | N T | 2 | (array) | 🆕 heap (quickselect ✅) | Yes | ⬜ |
| 704 | Binary Search | Easy | Binary Search | N G | 2 | array | — | Yes | ⬜ |
| 981 | Time Based Key-Value Store | Medium | Binary Search | N G | 2 | hashmap | — | Yes | ⬜ |
| 543 | Diameter of Binary Tree | Easy | Tree | N G | 2 | tree | — | Yes | ⬜ |
| 110 | Balanced Binary Tree | Easy | Tree | N G | 2 | tree | — | Yes | ⬜ |
| 416 | Partition Equal Subset Sum | Medium | DP | N G | 2 | array | — | Yes | ⬜ |
| 973 | K Closest Points to Origin | Medium | Heap | N G | 2 | (array) | 🆕 heap | Yes | ⬜ |
| 621 | Task Scheduler | Medium | Heap / Greedy | N G | 2 | (array) | 🆕 heap | Yes | ⬜ |
| 169 | Majority Element | Easy | Array | T G | 2 | array | — | Yes | ⬜ |
| 383 | Ransom Note | Easy | Hash | T G | 2 | hashmap | — | Yes | ⬜ |
| 236 | Lowest Common Ancestor of a Binary Tree | Medium | Tree | T G | 2 | tree | — | Yes | ⬜ |
| 67 | Add Binary | Easy | Bit / Math | T G | 2 | array | — | Yes | ⬜ |

## Tier 1 — appears in 1 of 4 sheets (add last; each moves coverage least)

### NeetCode 150 only (N)

| # | Problem | Diff | Topic | Renderer | Engine change | On LC | Status |
|---|---|---|---|---|---|---|---|
| 167 | Two Sum II - Input Array Is Sorted | Medium | Two Pointers | array | — | Yes | ✅ |
| 695 | Max Area of Island | Medium | Graph (DFS) | grid | — | Yes | ✅ |
| 347 | Top K Frequent Elements | Medium | Hash / Heap | hashmap (bucket) | — (heap path 🆕 heap) | Yes | ⬜ |
| 567 | Permutation in String | Medium | Sliding Window | array | — | Yes | ⬜ |
| 739 | Daily Temperatures | Medium | Monotonic Stack | stack | — | Yes | ⬜ |
| 853 | Car Fleet | Medium | Stack | stack | — | Yes | ⬜ |
| 875 | Koko Eating Bananas | Medium | Binary Search | array | — | Yes | ⬜ |
| 287 | Find the Duplicate Number | Medium | Two Pointers | array | — | Yes | ⬜ |
| 1448 | Count Good Nodes in Binary Tree | Medium | Tree | tree | — | Yes | ⬜ |
| 40 | Combination Sum II | Medium | Backtracking | recursion | — | Yes | ⬜ |
| 90 | Subsets II | Medium | Backtracking | recursion | — | Yes | ⬜ |
| 131 | Palindrome Partitioning | Medium | Backtracking | recursion | — | Yes | ⬜ |
| 684 | Redundant Connection | Medium | Union-Find | graph | — | Yes | ⬜ |
| 743 | Network Delay Time | Medium | Graph (Dijkstra) | graph | — | Yes | ⬜ |
| 1584 | Min Cost to Connect All Points | Medium | Graph (MST) | graph | — | Yes | ⬜ |
| 787 | Cheapest Flights Within K Stops | Medium | Graph | graph | — | Yes | ⬜ |
| 746 | Min Cost Climbing Stairs | Easy | DP (1-D) | array | — | Yes | ⬜ |
| 518 | Coin Change II | Medium | DP (2-D) | grid | — | Yes | ⬜ |
| 494 | Target Sum | Medium | DP | recursion | — | Yes | ⬜ |
| 309 | Best Time to Buy/Sell with Cooldown | Medium | DP | array | — | Yes | ⬜ |
| 846 | Hand of Straights | Medium | Greedy / Hash | hashmap | — | Yes | ⬜ |
| 1899 | Merge Triplets to Form Target | Medium | Greedy | array | — | Yes | ⬜ |
| 763 | Partition Labels | Medium | Greedy | array | — | Yes | ⬜ |
| 678 | Valid Parenthesis String | Medium | Greedy / Stack | stack | — | Yes | ⬜ |
| 43 | Multiply Strings | Medium | Math / String | array | — | Yes | ⬜ |
| 2013 | Detect Squares | Medium | Hash / Geometry | hashmap | — | Yes | ⬜ |
| 7 | Reverse Integer | Medium | Math / Bit | array | — | Yes | ⬜ |
| 703 | Kth Largest Element in a Stream | Easy | Heap | (array) | 🆕 heap | Yes | ⬜ |
| 1046 | Last Stone Weight | Easy | Heap | (array) | 🆕 heap | Yes | ⬜ |
| 355 | Design Twitter | Medium | Heap / Design | (hashmap) | 🆕 custom | Yes | ⬜ |
| 286 | Walls and Gates | Medium | Graph (BFS) | grid | — | 🔒Prem | ⬜ |

### LeetCode Top Interview 150 only (T)

| # | Problem | Diff | Topic | Renderer | Engine change | On LC | Status |
|---|---|---|---|---|---|---|---|
| 88 | Merge Sorted Array | Easy | Array / Two Pointers | array | — | Yes | ⬜ |
| 27 | Remove Element | Easy | Array | array | — | Yes | ⬜ |
| 26 | Remove Duplicates from Sorted Array | Easy | Array | array | — | Yes | ⬜ |
| 80 | Remove Duplicates from Sorted Array II | Medium | Array | array | — | Yes | ⬜ |
| 189 | Rotate Array | Medium | Array | array | — | Yes | ⬜ |
| 122 | Best Time to Buy and Sell Stock II | Medium | Greedy | array | — | Yes | ⬜ |
| 274 | H-Index | Medium | Array / Sorting | array | — | Yes | ⬜ |
| 380 | Insert Delete GetRandom O(1) | Medium | Hash / Design | hashmap | — | Yes | ⬜ |
| 13 | Roman to Integer | Easy | Hash / Math | hashmap | — | Yes | ⬜ |
| 12 | Integer to Roman | Medium | Math | array | — | Yes | ⬜ |
| 58 | Length of Last Word | Easy | String | array | — | Yes | ⬜ |
| 14 | Longest Common Prefix | Easy | String | (char-grid) | ⛔ DEFER | Yes | ⬜ |
| 151 | Reverse Words in a String | Medium | String | array | — | Yes | ⬜ |
| 6 | Zigzag Conversion | Medium | String | grid | — | Yes | ⬜ |
| 28 | Find the Index of First Occurrence | Easy | String | array | — | Yes | ⬜ |
| 392 | Is Subsequence | Easy | Two Pointers | array | — | Yes | ⬜ |
| 205 | Isomorphic Strings | Easy | Hash | hashmap | — | Yes | ⬜ |
| 290 | Word Pattern | Easy | Hash | hashmap | — | Yes | ⬜ |
| 219 | Contains Duplicate II | Easy | Hash | hashmap | — | Yes | ⬜ |
| 228 | Summary Ranges | Easy | Array | array | — | Yes | ⬜ |
| 209 | Minimum Size Subarray Sum | Medium | Sliding Window | array | — | Yes | ⬜ |
| 452 | Min Arrows to Burst Balloons | Medium | Interval | array | — | Yes | ⬜ |
| 71 | Simplify Path | Medium | Stack | stack | — | Yes | ⬜ |
| 92 | Reverse Linked List II | Medium | Linked List | linkedList | — | Yes | ⬜ |
| 82 | Remove Duplicates from Sorted List II | Medium | Linked List | linkedList | — | Yes | ⬜ |
| 61 | Rotate List | Medium | Linked List | linkedList | — | Yes | ⬜ |
| 86 | Partition List | Medium | Linked List | linkedList | — | Yes | ⬜ |
| 101 | Symmetric Tree | Easy | Tree | tree | — | Yes | ⬜ |
| 106 | Construct Binary Tree (Inorder+Postorder) | Medium | Tree | tree | — | Yes | ⬜ |
| 117 | Populating Next Right Pointers II | Medium | Tree | tree | — | Yes | ⬜ |
| 114 | Flatten Binary Tree to Linked List | Medium | Tree | tree | — | Yes | ⬜ |
| 112 | Path Sum | Easy | Tree | tree | — | Yes | ⬜ |
| 129 | Sum Root to Leaf Numbers | Medium | Tree | tree | — | Yes | ⬜ |
| 173 | Binary Search Tree Iterator | Medium | BST / Stack | tree | — | Yes | ⬜ |
| 222 | Count Complete Tree Nodes | Easy | Tree | tree | — | Yes | ⬜ |
| 637 | Average of Levels in Binary Tree | Easy | Tree (BFS) | tree | — | Yes | ⬜ |
| 103 | Binary Tree Zigzag Level Order | Medium | Tree (BFS) | tree | — | Yes | ⬜ |
| 530 | Minimum Absolute Difference in BST | Easy | BST | tree | — | Yes | ⬜ |
| 108 | Convert Sorted Array to BST | Easy | Tree / Divide | tree | — | Yes | ⬜ |
| 399 | Evaluate Division | Medium | Graph | graph | — | Yes | ⬜ |
| 909 | Snakes and Ladders | Medium | Graph (BFS) | grid | — | Yes | ⬜ |
| 433 | Minimum Genetic Mutation | Medium | Graph (BFS) | graph | — | Yes | ⬜ |
| 77 | Combinations | Medium | Backtracking | recursion | — | Yes | ⬜ |
| 35 | Search Insert Position | Easy | Binary Search | array | — | Yes | ⬜ |
| 162 | Find Peak Element | Medium | Binary Search | array | — | Yes | ⬜ |
| 34 | Find First and Last Position | Medium | Binary Search | array | — | Yes | ⬜ |
| 137 | Single Number II | Medium | Bit | (array) | 🆕 bit | Yes | ⬜ |
| 201 | Bitwise AND of Numbers Range | Medium | Bit | (array) | 🆕 bit | Yes | ⬜ |
| 9 | Palindrome Number | Easy | Math | array | — | Yes | ⬜ |
| 69 | Sqrt(x) | Easy | Math / Binary Search | array | — | Yes | ⬜ |
| 172 | Factorial Trailing Zeroes | Medium | Math | array | — | Yes | ⬜ |
| 120 | Triangle | Medium | DP (2-D) | grid | — | Yes | ⬜ |
| 64 | Minimum Path Sum | Medium | DP (2-D) | grid | — | Yes | ⬜ |
| 63 | Unique Paths II | Medium | DP (2-D) | grid | — | Yes | ⬜ |
| 373 | Find K Pairs with Smallest Sums | Medium | Heap | (array) | 🆕 heap | Yes | ⬜ |

### Grind 75 only (G)

| # | Problem | Diff | Topic | Renderer | Engine change | On LC | Status |
|---|---|---|---|---|---|---|---|
| 733 | Flood Fill | Easy | Graph (BFS/DFS) | grid | — | Yes | ✅ |
| 232 | Implement Queue using Stacks | Easy | Stack / Queue | queue | — | Yes | ⬜ |
| 278 | First Bad Version | Easy | Binary Search | array | — | Yes | ⬜ |
| 409 | Longest Palindrome | Easy | Hash | hashmap | — | Yes | ⬜ |
| 876 | Middle of the Linked List | Easy | Linked List | linkedList | — | Yes | ⬜ |
| 75 | Sort Colors | Medium | Two Pointers (Dutch flag) | array | — | Yes | ⬜ |
| 721 | Accounts Merge | Medium | Union-Find | graph | — | Yes | ⬜ |
| 8 | String to Integer (atoi) | Medium | String | array | — | Yes | ⬜ |
| 438 | Find All Anagrams in a String | Medium | Sliding Window | array | — | Yes | ⬜ |
| 310 | Minimum Height Trees | Medium | Graph | graph | — | Yes | ⬜ |
| 542 | 01 Matrix | Medium | Graph (BFS) | grid | — | Yes | ⬜ |

---

## Engine-gap roll-up (decide before authoring these)

- **🆕 heap** (no heap renderer): 215, 347 (heap path), 621, 703, 973, 1046, 373, 355. Either build a
  Heap/PQ renderer (one-time engine task, unlocks the whole pattern) or author the **array/hashmap
  alternative** (bucket-sort / quickselect) which is addable now. Recommend the alt approach for launch.
- **🆕 bit** (no bit renderer): 136, 137, 190, 191, 201, 268, 338, 371. Suggest **deferring the bit
  cluster** or building a simple bit-row via the `array` renderer.
- **🆕 custom** (bespoke component, D17): 146 LRU Cache (high value — 3 sheets), 355 Design Twitter.
- **⛔ DEFER**: 14 Longest Common Prefix — char-column comparison needs a char-grid renderer.
- **🔒 Premium** (real but locked on LeetCode): 252, 253, 261, 271, 286, 323.

## Already in our system but NOT in these four sheets
`4sum` · `remove-linked-list-elements` · `reverse-string` · `remove-covered-intervals` ·
`running-sum-of-1d-array`. (Kept for completeness; they don't advance sheet coverage.)

## Hard problems (excluded by scope)
Each sheet has a Hard tier we've omitted (Easy+Medium only): e.g. Trapping Rain Water, Minimum Window
Substring, Median of Two Sorted Arrays, Merge k Sorted Lists, Serialize/Deserialize Binary Tree, Word
Ladder, Find Median from Data Stream, N-Queens, Largest Rectangle in Histogram, Edit-Distance-family
hards, etc. Revisit after the Easy/Medium coverage lands.

## Sources
- Blind 75 — <https://github.com/amrita150/Blind-75-LeetCode-Questions>
- NeetCode 150 — <https://neetcode.io/practice/neetcode150> (list via <https://github.com/krmanik/Anki-NeetCode>)
- LeetCode Top Interview 150 — <https://leetcode.com/studyplan/top-interview-150/> (list via <https://github.com/ChunhThanhDe/Leetcode-Top-Interview>)
- Grind 75 — <https://www.techinterviewhandbook.org/grind75/> (list via <https://gist.github.com/cgjosephlee/c67f3810cf1e7efde0d9a32dd976f400>)
