class Solution:
    def longestPalindrome(self, s):
        n = len(s)
        best_lo = 0
        best_len = 1
        i = 0
        while i < n:
            j = i
            while j < n:
                lo = i
                hi = j
                is_pal = True
                while lo < hi:
                    if s[lo] != s[hi]:
                        is_pal = False
                        break
                    lo = lo + 1
                    hi = hi - 1
                span = j - i + 1
                if is_pal and span > best_len:
                    best_lo = i
                    best_len = span
                j = j + 1
            i = i + 1
        result = s[best_lo:best_lo + best_len]
        return result
