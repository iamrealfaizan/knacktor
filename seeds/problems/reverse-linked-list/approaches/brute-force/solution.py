class Solution:
    def reverseList(self, head):
        if not head:
            result = []
            return result
        head_links = list(range(1, len(head))) + [-1]
        values = []
        pos = 0
        while pos < len(head):
            values.append(head[pos])
            pos = pos + 1
        result = []
        i = len(values) - 1
        while i >= 0:
            result.append(values[i])
            i = i - 1
        return result
