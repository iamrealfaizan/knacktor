# The REAL Python solution — executed verbatim by the tracer.
# Line numbers here are load-bearing: mapping.json / narration.json / approach.json
# reference them. Keep one `class Solution` with the entrypoint method.
class Solution:
    def solve(self, nums):
        result = 0
        for x in nums:
            result += x
        return result
