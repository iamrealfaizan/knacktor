# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':
        def find_path(node, target, path):
            if not node:
                return False
            path.append(node)
            if node is target:
                return True
            if find_path(node.left, target, path) or find_path(node.right, target, path):
                return True
            path.pop()
            return False

        path_p = []
        path_q = []
        find_path(root, p, path_p)
        find_path(root, q, path_q)
        lca = None
        i = 0
        while i < len(path_p) and i < len(path_q) and path_p[i] is path_q[i]:
            lca = path_p[i]
            i += 1
        return lca
