class Solution:
    def removeElements(self, head, val):
        values = head
        links = list(range(1, len(values))) + [-1]
        removed = [0] * len(values)
        changed_links = []
        start = 0 if len(values) > 0 else -1
        while start != -1 and values[start] == val:
            removed[start] = 1
            start = links[start]
        if start == -1:
            result = []
            return result
        current = start
        while links[current] != -1:
            nxt = links[current]
            if values[nxt] == val:
                links[current] = links[nxt]
                links[nxt] = -1
                removed[nxt] = 1
                changed_links = [current]
            else:
                current = nxt
                changed_links = []
        result = []
        walk = start
        while walk != -1:
            result.append(values[walk])
            walk = links[walk]
        return result
