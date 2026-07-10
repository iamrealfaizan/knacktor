class Solution:
    def cloneGraph(self, adjList):
        n = len(adjList)
        nodes = []
        for i in range(n):
            nodes.append({"id": i + 1, "label": i + 1})
        edges = []
        for i in range(n):
            neighbors = adjList[i]
            for j in range(len(neighbors)):
                nb = neighbors[j]
                if i + 1 < nb:
                    edges.append({"from": i + 1, "to": nb})
        result = []
        for i in range(n):
            result.append([])
        cloned = {}
        if n == 0:
            return result
        queue = [1]
        head = 0
        cloned[1] = 1
        while head < len(queue):
            node = queue[head]
            head = head + 1
            neighbors = adjList[node - 1]
            for j in range(len(neighbors)):
                nb = neighbors[j]
                result[node - 1].append(nb)
                already = nb in cloned
                if not already:
                    cloned[nb] = nb
                    queue.append(nb)
        return result
