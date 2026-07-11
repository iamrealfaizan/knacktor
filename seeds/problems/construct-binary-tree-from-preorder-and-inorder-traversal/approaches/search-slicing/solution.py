class Solution:
    def buildTree(self, preorder, inorder):
        nodes = []
        by_id = {}
        state_by_id = []
        next_id = [0]
        root = self.build(preorder, inorder, nodes, by_id, state_by_id, next_id, -1, -1)
        result = self.serialize(root, by_id)
        return result

    def build(self, preorder, inorder, nodes, by_id, state_by_id, next_id, parent_id, side):
        if len(preorder) == 0:
            return None
        root_value = preorder[0]
        node_id = next_id[0]
        next_id[0] = next_id[0] + 1
        node = {"id": node_id, "value": root_value, "left": None, "right": None}
        nodes.append(node)
        by_id[node_id] = node
        state_by_id.append(1)
        if parent_id != -1:
            if side == 0:
                by_id[parent_id]["left"] = node_id
            else:
                by_id[parent_id]["right"] = node_id
        root_index = self.indexOf(inorder, root_value)
        left_size = root_index
        left_pre = preorder[1:1 + left_size]
        left_in = inorder[0:root_index]
        self.build(left_pre, left_in, nodes, by_id, state_by_id, next_id, node_id, 0)
        right_pre = preorder[1 + left_size:]
        right_in = inorder[root_index + 1:]
        self.build(right_pre, right_in, nodes, by_id, state_by_id, next_id, node_id, 1)
        state_by_id[node_id] = 2
        return node_id

    def indexOf(self, inorder, target):
        i = 0
        while i < len(inorder):
            if inorder[i] == target:
                return i
            i = i + 1

    def serialize(self, root, by_id):
        result = []
        out_q = []
        if root is not None:
            out_q.append(root)
        while len(out_q) > 0:
            emit_id = out_q.pop(0)
            if emit_id is None:
                result.append(None)
            else:
                result.append(by_id[emit_id]["value"])
                out_q.append(by_id[emit_id]["left"])
                out_q.append(by_id[emit_id]["right"])
        while len(result) > 0 and result[len(result) - 1] is None:
            result.pop()
        return result
