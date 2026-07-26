class Solution:
    def updateMatrix(self, mat):
        rows = len(mat)
        cols = len(mat[0])
        big = rows + cols
        dist = []
        for pr in range(rows):
            drow = []
            for pc in range(cols):
                if mat[pr][pc] == 0:
                    drow.append(0)
                else:
                    drow.append(big)
            dist.append(drow)
        for pr in range(rows):
            for pc in range(cols):
                if pr > 0:
                    if dist[pr - 1][pc] + 1 < dist[pr][pc]:
                        dist[pr][pc] = dist[pr - 1][pc] + 1
                if pc > 0:
                    if dist[pr][pc - 1] + 1 < dist[pr][pc]:
                        dist[pr][pc] = dist[pr][pc - 1] + 1
        for pr in range(rows - 1, -1, -1):
            for pc in range(cols - 1, -1, -1):
                if pr < rows - 1:
                    if dist[pr + 1][pc] + 1 < dist[pr][pc]:
                        dist[pr][pc] = dist[pr + 1][pc] + 1
                if pc < cols - 1:
                    if dist[pr][pc + 1] + 1 < dist[pr][pc]:
                        dist[pr][pc] = dist[pr][pc + 1] + 1
        return dist
