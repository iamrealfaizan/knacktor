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
        length = 0
        curr = 0 if sz > 0 else -1
        while curr != -1:
            length = length + 1
            curr = nextp[curr]
        curr = dummy
        steps = length - n
        moved = 0
        while moved < steps:
            curr = nextp[curr]
            moved = moved + 1
        removed = nextp[curr]
        nextp[curr] = nextp[nextp[curr]]
        changed = [curr]
        head = nextp[dummy]
        order = []
        cur2 = head
        while cur2 != -1:
            order.append(values[cur2])
            cur2 = nextp[cur2]
        return order
