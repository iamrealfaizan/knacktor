class Solution:
    def lowestCommonAncestor(self, values, p, q):
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
        path_p = []
        self.findPath(root, p, path_p, nodes, by_id, state_by_id)
        for i in range(n):
            state_by_id[i] = 0
        path_q = []
        self.findPath(root, q, path_q, nodes, by_id, state_by_id)
        for i in range(n):
            state_by_id[i] = 0
        for i in range(len(path_p)):
            state_by_id[path_p[i]] = 5
        for i in range(len(path_q)):
            state_by_id[path_q[i]] = 6
        lca = -1
        lca_id = -1
        depth = 0
        while depth < len(path_p) and depth < len(path_q):
            a = path_p[depth]
            b = path_q[depth]
            if a == b:
                state_by_id[a] = 4
                lca_id = a
                lca = by_id[a]["value"]
                depth = depth + 1
            else:
                break
        return lca

    def findPath(self, node_id, target, path, nodes, by_id, state_by_id):
        if node_id is None:
            return False
        path.append(node_id)
        state_by_id[node_id] = 1
        if by_id[node_id]["value"] == target:
            return True
        left = by_id[node_id]["left"]
        if self.findPath(left, target, path, nodes, by_id, state_by_id):
            return True
        right = by_id[node_id]["right"]
        if self.findPath(right, target, path, nodes, by_id, state_by_id):
            return True
        path.pop()
        state_by_id[node_id] = 2
        return False
