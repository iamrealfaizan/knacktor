class Solution:
    def buildTree(self, preorder, inorder):
        n = len(preorder)
        nodes = []
        by_id = {}
        state_by_id = []
        for i in range(n):
            state_by_id.append(0)
        inorder_index = {}
        for i in range(n):
            inorder_index[inorder[i]] = i
        pre_idx = [0]
        root = self.construct(preorder, 0, n - 1, inorder_index, pre_idx, nodes, by_id, state_by_id, -1, -1)
        result = self.serialize(root, by_id)
        return result

    def construct(self, preorder, left, right, inorder_index, pre_idx, nodes, by_id, state_by_id, parent_id, side):
        if left > right:
            return None
        node_id = pre_idx[0]
        root_value = preorder[node_id]
        pre_idx[0] = pre_idx[0] + 1
        node = {"id": node_id, "value": root_value, "left": None, "right": None}
        nodes.append(node)
        by_id[node_id] = node
        state_by_id[node_id] = 1
        if parent_id != -1:
            if side == 0:
                by_id[parent_id]["left"] = node_id
            else:
                by_id[parent_id]["right"] = node_id
        middle = inorder_index[root_value]
        self.construct(preorder, left, middle - 1, inorder_index, pre_idx, nodes, by_id, state_by_id, node_id, 0)
        self.construct(preorder, middle + 1, right, inorder_index, pre_idx, nodes, by_id, state_by_id, node_id, 1)
        state_by_id[node_id] = 2
        return node_id

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
