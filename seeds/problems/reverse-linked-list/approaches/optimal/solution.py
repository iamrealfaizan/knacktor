class Solution:
    def reverseList(self, head):
        result = []
        nodes = head[:]
        n = len(nodes)
        links = [-1] * n
        i = 0
        while i < n - 1:
            links[i] = i + 1
            i += 1
        previous = -1
        current = 0
        if n == 0:
            current = -1
        nxt = -1
        changed_links = []
        while current != -1:
            nxt = links[current]
            changed_links = [current]
            links[current] = previous
            previous = current
            current = nxt
        changed_links = []
        current = previous
        while current != -1:
            value = nodes[current]
            result.append(value)
            current = links[current]
        return result
