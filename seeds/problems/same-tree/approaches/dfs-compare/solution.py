class Solution:
    def isSameTree(self, p_values, q_values):
        p_nodes = []
        p_by = {}
        pn = len(p_values)
        pc = 1
        for i in range(pn):
            if p_values[i] is not None:
                node = {"id": i, "value": p_values[i], "left": None, "right": None}
                if pc < pn:
                    if p_values[pc] is not None:
                        node["left"] = pc
                    pc = pc + 1
                if pc < pn:
                    if p_values[pc] is not None:
                        node["right"] = pc
                    pc = pc + 1
                p_nodes.append(node)
                p_by[i] = node
        q_nodes = []
        q_by = {}
        qn = len(q_values)
        qc = 1
        for i in range(qn):
            if q_values[i] is not None:
                node = {"id": i, "value": q_values[i], "left": None, "right": None}
                if qc < qn:
                    if q_values[qc] is not None:
                        node["left"] = qc
                    qc = qc + 1
                if qc < qn:
                    if q_values[qc] is not None:
                        node["right"] = qc
                    qc = qc + 1
                q_nodes.append(node)
                q_by[i] = node
        same = True
        done = False
        matched = 0
        stack_p = []
        stack_q = []
        stack_p.append(0 if pn > 0 else None)
        stack_q.append(0 if qn > 0 else None)
        cur_p = None
        cur_q = None
        while len(stack_p) > 0 and not done:
            cur_p = stack_p.pop()
            cur_q = stack_q.pop()
            if cur_p is None and cur_q is None:
                matched = matched + 1
            elif cur_p is None or cur_q is None:
                same = False
                done = True
            elif p_by[cur_p]["value"] != q_by[cur_q]["value"]:
                same = False
                done = True
            else:
                matched = matched + 1
                stack_p.append(p_by[cur_p]["left"])
                stack_q.append(q_by[cur_q]["left"])
                stack_p.append(p_by[cur_p]["right"])
                stack_q.append(q_by[cur_q]["right"])
        return same
