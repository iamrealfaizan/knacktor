class Solution:
    def longestPalindrome(self, s):
        counts = {}
        i = 0
        ch = ""
        while i < len(s):
            ch = s[i]
            if ch in counts:
                counts[ch] = counts[ch] + 1
            else:
                counts[ch] = 1
            i = i + 1
        length = 0
        has_odd = False
        keys = list(counts.keys())
        ki = 0
        ch = ""
        count = 0
        while ki < len(keys):
            key = keys[ki]
            count = counts[key]
            length = length + (count // 2) * 2
            if count % 2 == 1:
                has_odd = True
            ki = ki + 1
        if has_odd:
            length = length + 1
        return length
