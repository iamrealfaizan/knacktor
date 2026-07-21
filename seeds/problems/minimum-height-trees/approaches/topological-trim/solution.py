class Solution:
    def findMinHeightTrees(self, n, edges):
        nodes = []
        for i in range(n):
            nodes.append({"id": i, "label": i})
        graph_edges = []
        for e in range(len(edges)):
            a = edges[e][0]
            b = edges[e][1]
            graph_edges.append({"from": a, "to": b})
        result = []
        if n <= 2:
            for i in range(n):
                result.append(i)
            return result
        adj = []
        for i in range(n):
            adj.append([])
        degree = []
        for i in range(n):
            degree.append(0)
        for e in range(len(edges)):
            a = edges[e][0]
            b = edges[e][1]
            adj[a].append(b)
            adj[b].append(a)
            degree[a] = degree[a] + 1
            degree[b] = degree[b] + 1
        state = []
        for i in range(n):
            state.append(0)
        leaves = []
        for i in range(n):
            if degree[i] == 1:
                leaves.append(i)
                state[i] = 1
        remaining = n
        cur = -1
        while remaining > 2:
            count = len(leaves)
            remaining = remaining - count
            k = 0
            while k < count:
                leaf = leaves[0]
                leaves.pop(0)
                cur = leaf
                state[leaf] = 2
                degree[leaf] = 0
                j = 0
                while j < len(adj[leaf]):
                    nb = adj[leaf][j]
                    if degree[nb] > 0:
                        degree[nb] = degree[nb] - 1
                        if degree[nb] == 1:
                            leaves.append(nb)
                            state[nb] = 1
                    j = j + 1
                cur = -1
                k = k + 1
        result = []
        for i in range(n):
            if state[i] != 2:
                result.append(i)
        return result
