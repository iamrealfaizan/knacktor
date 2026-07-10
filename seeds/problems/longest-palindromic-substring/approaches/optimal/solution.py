class Solution:
    def longestPalindrome(self, s):
        n = len(s)
        start = 0
        end = 0
        for center in range(n):
            for offset in range(2):
                left = center
                right = center + offset
                while left >= 0 and right < n and s[left] == s[right]:
                    left -= 1
                    right += 1
                if right - left - 1 > end - start + 1:
                    start = left + 1
                    end = right - 1
        result = s[start:end + 1]
        return result
