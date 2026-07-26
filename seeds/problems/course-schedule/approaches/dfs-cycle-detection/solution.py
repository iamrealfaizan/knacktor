class Solution:
    def canFinish(self, numCourses, prerequisites):
        nodes = []
        for i in range(numCourses):
            nodes.append({"id": i, "label": i})
        edges = []
        adj = []
        for i in range(numCourses):
            adj.append([])
        for p in range(len(prerequisites)):
            a = prerequisites[p][0]
            b = prerequisites[p][1]
            edges.append({"from": b, "to": a})
            adj[b].append(a)
        color = []
        for i in range(numCourses):
            color.append(0)
        has_cycle = False
        cur = -1
        start = 0
        while start < numCourses:
            if color[start] == 0:
                stack = [start]
                while len(stack) > 0:
                    node_id = stack[len(stack) - 1]
                    cur = node_id
                    if color[node_id] == 0:
                        color[node_id] = 1
                        for k in range(len(adj[node_id])):
                            nb = adj[node_id][k]
                            if color[nb] == 1:
                                has_cycle = True
                            if color[nb] == 0:
                                stack.append(nb)
                    else:
                        color[node_id] = 2
                        stack.pop()
                cur = -1
            start = start + 1
        result = not has_cycle
        return result
