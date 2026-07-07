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
        sp = []
        st = []
        st.append(0 if pn > 0 else None)
        while len(st) > 0:
            nd = st.pop()
            if nd is None:
                sp.append(None)
            else:
                sp.append(p_by[nd]["value"])
                st.append(p_by[nd]["right"])
                st.append(p_by[nd]["left"])
        sq = []
        st2 = []
        st2.append(0 if qn > 0 else None)
        while len(st2) > 0:
            nd = st2.pop()
            if nd is None:
                sq.append(None)
            else:
                sq.append(q_by[nd]["value"])
                st2.append(q_by[nd]["right"])
                st2.append(q_by[nd]["left"])
        same = True
        if len(sp) != len(sq):
            same = False
        i = 0
        while i < len(sp) and same:
            if sp[i] != sq[i]:
                same = False
            i = i + 1
        return same
