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
        answer = self.validate(root, by_id, state_by_id)
        return answer

    def validate(self, node_id, by_id, state_by_id):
        if node_id is None:
            return True
        state_by_id[node_id] = 1
        value = by_id[node_id]["value"]
        left_id = by_id[node_id]["left"]
        right_id = by_id[node_id]["right"]
        if left_id is not None:
            left_max = self.findMax(left_id, by_id)
            if left_max >= value:
                state_by_id[node_id] = 3
                return False
        if right_id is not None:
            right_min = self.findMin(right_id, by_id)
            if right_min <= value:
                state_by_id[node_id] = 3
                return False
        left_valid = self.validate(left_id, by_id, state_by_id)
        right_valid = self.validate(right_id, by_id, state_by_id)
        result = left_valid and right_valid
        state_by_id[node_id] = 2
        return result

    def findMax(self, node_id, by_id):
        if node_id is None:
            return -2147483649
        best = by_id[node_id]["value"]
        left_max = self.findMax(by_id[node_id]["left"], by_id)
        if left_max > best:
            best = left_max
        right_max = self.findMax(by_id[node_id]["right"], by_id)
        if right_max > best:
            best = right_max
        return best

    def findMin(self, node_id, by_id):
        if node_id is None:
            return 2147483648
        best = by_id[node_id]["value"]
        left_min = self.findMin(by_id[node_id]["left"], by_id)
        if left_min < best:
            best = left_min
        right_min = self.findMin(by_id[node_id]["right"], by_id)
        if right_min < best:
            best = right_min
        return best
