class Solution:
    def longestPalindrome(self, s):
        n = len(s)
        dp = []
        for i in range(n):
            dp.append([0] * n)
        best_lo = 0
        best_len = 1
        i = 0
        while i < n:
            dp[i][i] = 1
            i = i + 1
        length = 2
        while length <= n:
            i = 0
            while i + length - 1 < n:
                j = i + length - 1
                ends_match = s[i] == s[j]
                inner_ok = length == 2
                if dp[i + 1][j - 1] == 1:
                    inner_ok = True
                if ends_match and inner_ok:
                    dp[i][j] = 1
                    if length > best_len:
                        best_len = length
                        best_lo = i
                i = i + 1
            length = length + 1
        result = s[best_lo:best_lo + best_len]
        return result
