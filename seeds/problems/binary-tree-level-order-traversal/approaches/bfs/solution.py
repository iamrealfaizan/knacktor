class Solution:
    def levelOrder(self, values):
        result = []
        n = len(values)
        if n == 0:
            return result
        nodes = []
        by_id = {}
        status = []
        for i in range(n):
            status.append(0)
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
        queue.append(0)
        status[0] = 1
        head = 0
        cur_id = -1
        while head < len(queue):
            level_size = len(queue) - head
            level = []
            j = 0
            while j < level_size:
                node_id = queue[head]
                head = head + 1
                cur_id = node_id
                status[node_id] = 2
                node = by_id[node_id]
                level.append(node["value"])
                if node["left"] is not None:
                    queue.append(node["left"])
                    status[node["left"]] = 1
                if node["right"] is not None:
                    queue.append(node["right"])
                    status[node["right"]] = 1
                j = j + 1
            result.append(level)
        return result
