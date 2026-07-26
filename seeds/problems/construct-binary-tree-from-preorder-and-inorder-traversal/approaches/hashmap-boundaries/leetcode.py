# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
from typing import List, Optional


class Solution:
    def buildTree(self, preorder: List[int], inorder: List[int]) -> Optional[TreeNode]:
        index = {value: i for i, value in enumerate(inorder)}
        self.pre = 0

        def build(lo, hi):
            if lo > hi:
                return None
            root_val = preorder[self.pre]
            self.pre += 1
            root = TreeNode(root_val)
            mid = index[root_val]
            root.left = build(lo, mid - 1)
            root.right = build(mid + 1, hi)
            return root

        return build(0, len(inorder) - 1)
