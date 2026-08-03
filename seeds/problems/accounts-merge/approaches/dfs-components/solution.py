class Solution:
    def accountsMerge(self, accounts):
        email_id = {}
        email_list = []
        owner = []
        adj = []
        for ai in range(len(accounts)):
            account = accounts[ai]
            name = account[0]
            ei = 1
            while ei < len(account):
                email = account[ei]
                if email not in email_id:
                    email_id[email] = len(email_list)
                    email_list.append(email)
                    owner.append(name)
                    adj.append([])
                ei = ei + 1
        for ai in range(len(accounts)):
            account = accounts[ai]
            first = email_id[account[1]]
            ei = 2
            while ei < len(account):
                other = email_id[account[ei]]
                adj[first].append(other)
                adj[other].append(first)
                ei = ei + 1
        nodes = []
        for i in range(len(email_list)):
            nodes.append({"id": i, "label": email_list[i]})
        graph_edges = []
        for i in range(len(email_list)):
            for j in range(len(adj[i])):
                nb = adj[i][j]
                if i < nb:
                    graph_edges.append({"from": i, "to": nb})
        visited = []
        for i in range(len(email_list)):
            visited.append(0)
        result = []
        cur = -1
        start = 0
        while start < len(email_list):
            if visited[start] == 0:
                comp = []
                stack = [start]
                visited[start] = 1
                while len(stack) > 0:
                    node_id = stack.pop()
                    cur = node_id
                    comp.append(email_list[node_id])
                    for j in range(len(adj[node_id])):
                        nb = adj[node_id][j]
                        if visited[nb] == 0:
                            visited[nb] = 1
                            stack.append(nb)
                cur = -1
                comp.sort()
                merged = [owner[start]]
                for j in range(len(comp)):
                    merged.append(comp[j])
                result.append(merged)
            start = start + 1
        return result
