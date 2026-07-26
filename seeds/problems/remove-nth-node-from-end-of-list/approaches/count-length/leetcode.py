# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
from typing import Optional


class Solution:
    def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:
        length = 0
        node = head
        while node:
            length += 1
            node = node.next
        dummy = ListNode(0, head)
        curr = dummy
        for _ in range(length - n):
            curr = curr.next
        curr.next = curr.next.next
        return dummy.next
