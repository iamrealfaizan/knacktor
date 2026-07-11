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
        queue = []
        cur = -1
        depth = 0
        if n > 0:
            queue.append(0)
            state_by_id[0] = 1
        while len(queue) > 0:
            level_size = len(queue)
            depth = depth + 1
            for k in range(level_size):
                cur = queue.pop(0)
                state_by_id[cur] = 2
                left = by_id[cur]["left"]
                right = by_id[cur]["right"]
                if left is not None:
                    queue.append(left)
                    state_by_id[left] = 1
                if right is not None:
                    queue.append(right)
                    state_by_id[right] = 1
        cur = -1
        return depth
