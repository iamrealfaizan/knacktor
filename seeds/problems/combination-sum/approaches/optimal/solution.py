class Solution:
    def combinationSum(self, candidates, target):
        result = []
        path = []
        self.backtrack(candidates, target, 0, path, result)
        return result

    def backtrack(self, candidates, remaining, start, path, result):
        if remaining == 0:
            result.append(list(path))
            return
        if remaining < 0:
            return
        for i in range(start, len(candidates)):
            path.append(candidates[i])
            self.backtrack(candidates, remaining - candidates[i], i, path, result)
            path.pop()
