class ListNode:
    def __init__(self, val=0, nxt=None):
        self.val = val
        self.next = nxt

class Solution:
    def removeElements(self, head, val):
        if isinstance(head, list):
            vals = head
            nodes_list = [ListNode(v) for v in vals]
            for k in range(len(nodes_list) - 1):
                nodes_list[k].next = nodes_list[k + 1]
            head = nodes_list[0] if nodes_list else None
        new_head = self._recurse(head, val)
        result = []
        node = new_head
        while node:
            result.append(node.val)
            node = node.next
        return result

    def _recurse(self, head, val):
        if head is None:
            return None
        head.next = self._recurse(head.next, val)
        if head.val == val:
            return head.next
        return head
