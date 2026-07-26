# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
from typing import Optional


class Solution:
    def isSameTree(self, p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:
        def serialize(node):
            if node is None:
                return [None]
            return [node.val] + serialize(node.left) + serialize(node.right)
        return serialize(p) == serialize(q)
