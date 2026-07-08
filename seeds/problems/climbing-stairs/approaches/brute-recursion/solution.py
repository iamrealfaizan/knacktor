class Solution(object):
    def climbStairs(self, n):
        nodes = []
        by_id = {}
        state_by_id = []
        answer = self.dfs(0, n, None, 0, nodes, by_id, state_by_id)
        return answer

    def dfs(self, i, n, parent_id, slot, nodes, by_id, state_by_id):
        my_id = len(nodes)
        node = {"id": my_id, "value": i, "left": None, "right": None}
        nodes.append(node)
        by_id[my_id] = node
        state_by_id.append(1)
        if parent_id is not None:
            if slot == 0:
                by_id[parent_id]["left"] = my_id
            else:
                by_id[parent_id]["right"] = my_id
        if i == n:
            state_by_id[my_id] = 3
            return 1
        if i > n:
            state_by_id[my_id] = 4
            return 0
        left_val = self.dfs(i + 1, n, my_id, 0, nodes, by_id, state_by_id)
        right_val = self.dfs(i + 2, n, my_id, 1, nodes, by_id, state_by_id)
        total = left_val + right_val
        state_by_id[my_id] = 2
        return total
