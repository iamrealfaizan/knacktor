class Solution:
    def reverseString(self, s):
        n = len(s)
        rev = []
        for i in range(n - 1, -1, -1):
            rev.append(s[i])
        for i in range(n):
            s[i] = rev[i]
        return s
