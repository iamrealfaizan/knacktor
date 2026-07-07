class Solution:
    def removeNthFromEnd(self, values, n):
        sz = len(values)
        nextp = []
        for i in range(sz):
            if i < sz - 1:
                nextp.append(i + 1)
            else:
                nextp.append(-1)
        disp_vals = []
        for i in range(sz):
            disp_vals.append(values[i])
        disp_vals.append(0)
        dummy = sz
        nextp.append(0 if sz > 0 else -1)
        changed = []
        slow = dummy
        fast = dummy
        moved = 0
        while moved < n:
            fast = nextp[fast]
            moved = moved + 1
        while nextp[fast] != -1:
            slow = nextp[slow]
            fast = nextp[fast]
        removed = nextp[slow]
        nextp[slow] = nextp[nextp[slow]]
        changed = [slow]
        head = nextp[dummy]
        order = []
        cur2 = head
        while cur2 != -1:
            order.append(values[cur2])
            cur2 = nextp[cur2]
        return order
