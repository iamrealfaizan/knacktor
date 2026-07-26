# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
from typing import Optional


class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        values = []
        node = head
        while node:
            values.append(node.val)
            node = node.next
        dummy = ListNode()
        tail = dummy
        for v in reversed(values):
            tail.next = ListNode(v)
            tail = tail.next
        return dummy.next
