class Solution:
    def lengthOfLongestSubstring(self, s):
        n = len(s)
        best = 0
        best_start = 0
        i = 0
        while i < n:
            seen = ""
            length = 0
            j = i
            while j < n:
                ch = s[j]
                is_dup = ch in seen
                if is_dup:
                    break
                seen = seen + ch
                length = length + 1
                j = j + 1
            if length > best:
                best = length
                best_start = i
            i = i + 1
        return best
