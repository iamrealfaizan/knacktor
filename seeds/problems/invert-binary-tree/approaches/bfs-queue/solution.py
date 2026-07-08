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
        queue = []
        cur = -1
        if n > 0:
            queue.append(0)
            state_by_id[0] = 1
        while len(queue) > 0:
            cur = queue.pop(0)
            state_by_id[cur] = 2
            left = by_id[cur]["left"]
            right = by_id[cur]["right"]
            by_id[cur]["left"] = right
            by_id[cur]["right"] = left
            if by_id[cur]["left"] is not None:
                queue.append(by_id[cur]["left"])
                state_by_id[by_id[cur]["left"]] = 1
            if by_id[cur]["right"] is not None:
                queue.append(by_id[cur]["right"])
                state_by_id[by_id[cur]["right"]] = 1
        cur = -1
        result = []
        out_q = []
        if n > 0:
            out_q.append(0)
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
