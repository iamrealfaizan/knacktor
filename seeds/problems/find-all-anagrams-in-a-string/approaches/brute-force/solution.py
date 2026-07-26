class Solution:
    def findAnagrams(self, s, p):
        result = []
        n = len(s)
        m = len(p)
        need = [0] * 26
        for ch in p:
            need[ord(ch) - 97] += 1
        start = 0
        while start + m <= n:
            end = start + m - 1
            window = [0] * 26
            matched = False
            pos = start
            while pos <= end:
                window[ord(s[pos]) - 97] += 1
                pos += 1
            if window == need:
                matched = True
                result.append(start)
            start += 1
        return result
