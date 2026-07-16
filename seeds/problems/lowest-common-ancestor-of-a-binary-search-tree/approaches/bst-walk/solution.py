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
        current = 0 if n > 0 else None
        answer = -1
        found = False
        while current is not None:
            current_val = by_id[current]["value"]
            state_by_id[current] = 1
            if p < current_val and q < current_val:
                state_by_id[current] = 2
                current = by_id[current]["left"]
            elif p > current_val and q > current_val:
                state_by_id[current] = 2
                current = by_id[current]["right"]
            else:
                answer = current_val
                found = True
                break
        return answer
