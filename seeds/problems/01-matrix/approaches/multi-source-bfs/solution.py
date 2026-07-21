class Solution:
    def updateMatrix(self, mat):
        rows = len(mat)
        cols = len(mat[0])
        dist = []
        for r in range(rows):
            dist.append([-1] * cols)
        state = []
        for r in range(rows):
            state.append([0] * cols)
        cur_r = -1
        cur_c = -1
        dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        queue = []
        for r in range(rows):
            for c in range(cols):
                if mat[r][c] == 0:
                    dist[r][c] = 0
                    state[r][c] = 1
                    queue.append([r, c])
        while len(queue) > 0:
            cell = queue.pop(0)
            cur_r = cell[0]
            cur_c = cell[1]
            state[cur_r][cur_c] = 2
            for d in dirs:
                nr = cur_r + d[0]
                nc = cur_c + d[1]
                if nr >= 0 and nr < rows and nc >= 0 and nc < cols and state[nr][nc] == 0:
                    dist[nr][nc] = dist[cur_r][cur_c] + 1
                    state[nr][nc] = 1
                    queue.append([nr, nc])
        return dist
