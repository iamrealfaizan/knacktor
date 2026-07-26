class Solution:
    def wordBreak(self, s, wordDict):
        n = len(s)
        memo = [0] * (n + 1)
        memo[n] = 1
        answer = self.solve(s, wordDict, 0, memo, n)
        return answer

    def solve(self, s, wordDict, i, memo, n):
        if memo[i] != 0:
            return memo[i] == 1
        found = False
        for word in wordDict:
            end = i + len(word)
            if end <= n:
                if s[i:end] == word:
                    if self.solve(s, wordDict, end, memo, n):
                        found = True
        if found:
            memo[i] = 1
        else:
            memo[i] = -1
        return found
