class Solution:
    def canFinish(self, numCourses, prerequisites):
        nodes = []
        for i in range(numCourses):
            nodes.append({"id": i, "label": i})
        indegree = []
        for i in range(numCourses):
            indegree.append(0)
        edges = []
        for p in range(len(prerequisites)):
            a = prerequisites[p][0]
            b = prerequisites[p][1]
            edges.append({"from": b, "to": a})
            indegree[a] = indegree[a] + 1
        status = []
        for i in range(numCourses):
            status.append(0)
        queue = []
        head = 0
        for i in range(numCourses):
            if indegree[i] == 0:
                queue.append(i)
                status[i] = 1
        cur = -1
        taken = 0
        while head < len(queue):
            node_id = queue[head]
            head = head + 1
            cur = node_id
            status[node_id] = 2
            taken = taken + 1
            for e in range(len(edges)):
                if edges[e]["from"] == node_id:
                    nb = edges[e]["to"]
                    indegree[nb] = indegree[nb] - 1
                    if indegree[nb] == 0:
                        queue.append(nb)
                        status[nb] = 1
            cur = -1
        result = taken == numCourses
        return result
