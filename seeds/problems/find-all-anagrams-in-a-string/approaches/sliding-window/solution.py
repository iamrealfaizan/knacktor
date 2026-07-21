class Solution:
    def findAnagrams(self, s, p):
        res = []
        if len(p) > len(s):
            return res
        need = {}
        window = {}
        i = 0
        while i < len(p):
            pc = p[i]
            if pc in need:
                need[pc] = need[pc] + 1
            else:
                need[pc] = 1
            sc = s[i]
            if sc in window:
                window[sc] = window[sc] + 1
            else:
                window[sc] = 1
            i = i + 1
        left = 0
        right = len(p) - 1
        matched = window == need
        if matched:
            res.append(left)
        while right < len(s) - 1:
            matched = False
            right = right + 1
            enter = s[right]
            if enter in window:
                window[enter] = window[enter] + 1
            else:
                window[enter] = 1
            leave = s[left]
            window[leave] = window[leave] - 1
            if window[leave] == 0:
                del window[leave]
            left = left + 1
            matched = window == need
            if matched:
                res.append(left)
        return res
