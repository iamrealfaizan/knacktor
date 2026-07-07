class Solution:
    def lengthOfLongestSubstring(self, s):
        seen = {}
        left = 0
        best = 0
        for right in range(len(s)):
            ch = s[right]
            if ch in seen and seen[ch] >= left:
                left = seen[ch] + 1
            seen[ch] = right
            window = right - left + 1
            if window > best:
                best = window
        return best
