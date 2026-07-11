class Solution:
    def maxDepth(self, values):
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
        answer = self.depth(root, nodes, by_id, state_by_id)
        return answer

    def depth(self, node_id, nodes, by_id, state_by_id):
        if node_id is None:
            return 0
        state_by_id[node_id] = 1
        left_depth = self.depth(by_id[node_id]["left"], nodes, by_id, state_by_id)
        right_depth = self.depth(by_id[node_id]["right"], nodes, by_id, state_by_id)
        best = left_depth
        if right_depth > best:
            best = right_depth
        node_depth = best + 1
        state_by_id[node_id] = 2
        return node_depth
