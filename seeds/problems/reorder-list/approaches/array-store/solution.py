class Solution:
    def reorderList(self, values):
        n = len(values)
        nextp = []
        for i in range(n):
            if i < n - 1:
                nextp.append(i + 1)
            else:
                nextp.append(-1)
        changed = []
        left = 0
        right = n - 1
        while left < right:
            nextp[left] = right
            changed = [left]
            left = left + 1
            if left == right:
                break
            nextp[right] = left
            changed = [right]
            right = right - 1
        nextp[left] = -1
        changed = [left]
        order = []
        cur = 0 if n > 0 else -1
        while cur != -1:
            order.append(values[cur])
            cur = nextp[cur]
        return order
