class Solution:
    def findMinHeightTrees(self, n, edges):
        nodes = []
        for i in range(n):
            nodes.append({"id": i, "label": i})
        graph_edges = []
        adj = []
        for i in range(n):
            adj.append([])
        for e in range(len(edges)):
            a = edges[e][0]
            b = edges[e][1]
            graph_edges.append({"from": a, "to": b})
            adj[a].append(b)
            adj[b].append(a)
        heights = []
        for i in range(n):
            heights.append(-1)
        best_height = n
        root = 0
        cur = -1
        while root < n:
            dist = []
            for i in range(n):
                dist.append(-1)
            dist[root] = 0
            queue = [root]
            head = 0
            far = 0
            while head < len(queue):
                node_id = queue[head]
                head = head + 1
                cur = node_id
                if dist[node_id] > far:
                    far = dist[node_id]
                for k in range(len(adj[node_id])):
                    nb = adj[node_id][k]
                    if dist[nb] == -1:
                        dist[nb] = dist[node_id] + 1
                        queue.append(nb)
            cur = -1
            heights[root] = far
            if far < best_height:
                best_height = far
            root = root + 1
        result = []
        for i in range(n):
            if heights[i] == best_height:
                result.append(i)
        return result
