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
        slow = 0
        fast = 0
        while n > 2 and nextp[fast] != -1 and nextp[nextp[fast]] != -1:
            slow = nextp[slow]
            fast = nextp[nextp[fast]]
        second = nextp[slow]
        if second != -1:
            nextp[slow] = -1
            changed = [slow]
        prev = -1
        curr = second
        while curr != -1:
            nxt_node = nextp[curr]
            nextp[curr] = prev
            changed = [curr]
            prev = curr
            curr = nxt_node
        first = 0
        second = prev
        while second != -1:
            temp1 = nextp[first]
            temp2 = nextp[second]
            nextp[first] = second
            changed = [first]
            nextp[second] = temp1
            first = temp1
            second = temp2
        order = []
        cur = 0 if n > 0 else -1
        while cur != -1:
            order.append(values[cur])
            cur = nextp[cur]
        return order
