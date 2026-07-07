class Solution:
    def kthSmallest(self, values, k):
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
        stack = []
        cur = 0 if n > 0 else None
        count = 0
        answer = -1
        while cur is not None or len(stack) > 0:
            while cur is not None:
                stack.append(cur)
                state_by_id[cur] = 1
                cur = by_id[cur]["left"]
            cur = stack.pop()
            state_by_id[cur] = 2
            count = count + 1
            if count == k:
                answer = by_id[cur]["value"]
                break
            cur = by_id[cur]["right"]
        return answer
