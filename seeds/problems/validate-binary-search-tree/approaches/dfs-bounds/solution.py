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
        low = -2147483649
        high = 2147483648
        answer = self.validate(root, low, high, by_id, state_by_id)
        return answer

    def validate(self, node_id, lower, upper, by_id, state_by_id):
        if node_id is None:
            return True
        state_by_id[node_id] = 1
        value = by_id[node_id]["value"]
        if value <= lower:
            state_by_id[node_id] = 3
            return False
        if value >= upper:
            state_by_id[node_id] = 3
            return False
        left_valid = self.validate(by_id[node_id]["left"], lower, value, by_id, state_by_id)
        right_valid = self.validate(by_id[node_id]["right"], value, upper, by_id, state_by_id)
        result = left_valid and right_valid
        state_by_id[node_id] = 2
        return result
