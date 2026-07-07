class Solution:
    def isAnagram(self, s, t):
        if len(s) != len(t):
            return False
        counts = {}
        for i in range(len(s)):
            ch = s[i]
            counts[ch] = counts.get(ch, 0) + 1
        for j in range(len(t)):
            d = t[j]
            if d not in counts:
                return False
            counts[d] = counts[d] - 1
            if counts[d] < 0:
                return False
        return True
