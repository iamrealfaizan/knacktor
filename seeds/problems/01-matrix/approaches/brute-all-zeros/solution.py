class Solution:
    def updateMatrix(self, mat):
        rows = len(mat)
        cols = len(mat[0])
        zeros = []
        for zr in range(rows):
            for zc in range(cols):
                if mat[zr][zc] == 0:
                    zeros.append([zr, zc])
        big = rows + cols
        dist = []
        for rr in range(rows):
            dist.append([big] * cols)
        cr = 0
        while cr < rows:
            cc = 0
            while cc < cols:
                best = big
                zi = 0
                while zi < len(zeros):
                    zr = zeros[zi][0]
                    zc = zeros[zi][1]
                    cand = abs(cr - zr) + abs(cc - zc)
                    if cand < best:
                        best = cand
                    zi = zi + 1
                dist[cr][cc] = best
                cc = cc + 1
            cr = cr + 1
        return dist
