class Solution:
    def hasCycle(self, values, pos):
        n = len(values)
        nxt = []
        for i in range(n):
            if i < n - 1:
                nxt.append(i + 1)
            else:
                nxt.append(pos)
        visited = []
        for i in range(n):
            visited.append(False)
        cur = 0 if n > 0 else -1
        found = False
        while cur != -1:
            if visited[cur]:
                found = True
                break
            visited[cur] = True
            cur = nxt[cur]
        return found
