class Solution:
    def hasCycle(self, values, pos):
        n = len(values)
        nxt = []
        for i in range(n):
            if i < n - 1:
                nxt.append(i + 1)
            else:
                nxt.append(pos)
        slow = 0 if n > 0 else -1
        fast = 0 if n > 0 else -1
        found = False
        while fast != -1 and nxt[fast] != -1:
            fast = nxt[nxt[fast]]
            slow = nxt[slow]
            if fast == slow:
                found = True
                break
        return found
