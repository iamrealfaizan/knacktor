class Solution:
    def wordBreak(self, s, wordDict):
        words = set(wordDict)
        n = len(s)
        dp = [0] * (n + 1)
        dp[0] = 1
        for i in range(1, n + 1):
            for j in range(i):
                piece = s[j:i]
                fits = piece in words
                if dp[j] == 1 and fits:
                    dp[i] = 1
        result = dp[n] == 1
        return result
