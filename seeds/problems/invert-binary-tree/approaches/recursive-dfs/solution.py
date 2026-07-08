class Solution:
    def invertTree(self, values):
        n = len(values)
        nodes = []
        by_id = {}
        state_by_id = []
        for i in range(n):
            state_by_id.append(0)
        child = 1
        for i in range(n):
            if values[i] is not None:
                node = {"id": i, "value": values[i], "left": None, "right": None}
                if child < n:
                    if values[child] is not None:
                        node["left"] = child
                    child = child + 1
                if child < n:
                    if values[child] is not None:
                        node["right"] = child
                    child = child + 1
                nodes.append(node)
                by_id[i] = node
        root = 0 if n > 0 else None
        self.invert(root, nodes, by_id, state_by_id)
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

    def invert(self, node_id, nodes, by_id, state_by_id):
        if node_id is None:
            return
        state_by_id[node_id] = 1
        left = by_id[node_id]["left"]
        right = by_id[node_id]["right"]
        by_id[node_id]["left"] = right
        by_id[node_id]["right"] = left
        self.invert(by_id[node_id]["left"], nodes, by_id, state_by_id)
        self.invert(by_id[node_id]["right"], nodes, by_id, state_by_id)
        state_by_id[node_id] = 2
        return
