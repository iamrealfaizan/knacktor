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
        stack = []
        current = 0
        if n == 0:
            current = -1
        changed_links = []
        while current != -1:
            stack.append(current)
            current = links[current]
        new_head = -1
        tail = -1
        node = -1
        while len(stack) > 0:
            node = stack.pop()
            if new_head == -1:
                new_head = node
                tail = node
            else:
                changed_links = [tail]
                links[tail] = node
                tail = node
            changed_links = [tail]
            links[tail] = -1
        changed_links = []
        current = new_head
        while current != -1:
            value = nodes[current]
            result.append(value)
            current = links[current]
        return result
