class Solution:
    def isValidBST(self, values):
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
        prev = [None]
        answer = self.inorder(root, prev, by_id, state_by_id)
        return answer

    def inorder(self, node_id, prev, by_id, state_by_id):
        if node_id is None:
            return True
        state_by_id[node_id] = 1
        left_valid = self.inorder(by_id[node_id]["left"], prev, by_id, state_by_id)
        if left_valid == False:
            return False
        value = by_id[node_id]["value"]
        previous = prev[0]
        if previous is not None:
            if value <= previous:
                state_by_id[node_id] = 3
                return False
        prev[0] = value
        state_by_id[node_id] = 2
        right_valid = self.inorder(by_id[node_id]["right"], prev, by_id, state_by_id)
        return right_valid
