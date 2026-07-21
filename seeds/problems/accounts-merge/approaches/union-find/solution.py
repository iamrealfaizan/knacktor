class Solution:
    def accountsMerge(self, accounts):
        n = len(accounts)
        parent = []
        for i in range(n):
            parent.append(i)
        nodes = []
        for i in range(n):
            nodes.append({"id": i, "label": accounts[i][0]})
        links = []
        email_owner = {}
        i = 0
        while i < n:
            acc = accounts[i]
            j = 1
            while j < len(acc):
                email = acc[j]
                if email in email_owner:
                    other = email_owner[email]
                    rx = i
                    while parent[rx] != rx:
                        rx = parent[rx]
                    ry = other
                    while parent[ry] != ry:
                        ry = parent[ry]
                    if rx != ry:
                        parent[rx] = ry
                        links.append({"from": rx, "to": ry})
                else:
                    email_owner[email] = i
                j = j + 1
            i = i + 1
        groups = {}
        for email in email_owner:
            owner = email_owner[email]
            root = owner
            while parent[root] != root:
                root = parent[root]
            if root in groups:
                groups[root].append(email)
            else:
                groups[root] = [email]
        roots = []
        for root in groups:
            roots.append(root)
        roots.sort()
        result = []
        r = 0
        while r < len(roots):
            root = roots[r]
            emails = groups[root]
            emails.sort()
            name = accounts[root][0]
            merged = [name]
            e = 0
            while e < len(emails):
                merged.append(emails[e])
                e = e + 1
            result.append(merged)
            r = r + 1
        return result
