class Solution:
    def numIslands(self, grid):
        rows = len(grid)
        cols = len(grid[0])
        state = []
        for r in range(rows):
            state.append([0] * cols)
        count = 0
        cur_r = -1
        cur_c = -1
        dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        for sr in range(rows):
            for sc in range(cols):
                if grid[sr][sc] == '1' and state[sr][sc] == 0:
                    count = count + 1
                    stack = []
                    stack.append([sr, sc])
                    state[sr][sc] = 1
                    while len(stack) > 0:
                        cell = stack.pop()
                        cur_r = cell[0]
                        cur_c = cell[1]
                        state[cur_r][cur_c] = 2
                        for d in dirs:
                            nr = cur_r + d[0]
                            nc = cur_c + d[1]
                            if nr >= 0 and nr < rows and nc >= 0 and nc < cols and grid[nr][nc] == '1' and state[nr][nc] == 0:
                                state[nr][nc] = 1
                                stack.append([nr, nc])
                    cur_r = -1
                    cur_c = -1
        return count
