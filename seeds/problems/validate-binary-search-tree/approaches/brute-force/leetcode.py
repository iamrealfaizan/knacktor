# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
from typing import Optional


class Solution:
    def isValidBST(self, root: Optional[TreeNode]) -> bool:
        def subtree_max(node):
            best = node.val
            if node.left:
                best = max(best, subtree_max(node.left))
            if node.right:
                best = max(best, subtree_max(node.right))
            return best

        def subtree_min(node):
            best = node.val
            if node.left:
                best = min(best, subtree_min(node.left))
            if node.right:
                best = min(best, subtree_min(node.right))
            return best

        def valid(node):
            if not node:
                return True
            if node.left and subtree_max(node.left) >= node.val:
                return False
            if node.right and subtree_min(node.right) <= node.val:
                return False
            return valid(node.left) and valid(node.right)

        return valid(root)
