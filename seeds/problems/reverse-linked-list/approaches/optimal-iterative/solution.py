class Solution:
    def reverseList(self, head):
        if not head:
            result = []
            return result
        head_links = list(range(1, len(head))) + [-1]
        previous = None
        current = 0
        changed_links = []
        while current < len(head):
            nxt = current + 1
            head_links[current] = -1 if previous is None else previous
            changed_links = [{'from': current, 'to': previous}]
            previous = current
            current = nxt
        result = list(reversed(head))
        return result
