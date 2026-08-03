class Solution:
    def isAnagram(self, s, t):
        answer = len(s) == len(t)
        if not answer:
            return answer
        used = [False] * len(t)
        i = 0
        while i < len(s):
            found = False
            j = 0
            while j < len(t):
                same = s[i] == t[j]
                available = not used[j]
                if same and available:
                    used[j] = True
                    found = True
                    break
                j = j + 1
            if not found:
                answer = False
                return answer
            i = i + 1
        return answer
