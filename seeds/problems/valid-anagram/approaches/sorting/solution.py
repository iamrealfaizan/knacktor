class Solution:
    def isAnagram(self, s, t):
        if len(s) != len(t):
            return False
        s_chars = sorted(s)
        t_chars = sorted(t)
        i = 0
        answer = True
        while i < len(s_chars):
            if s_chars[i] != t_chars[i]:
                answer = False
                break
            i = i + 1
        return answer
