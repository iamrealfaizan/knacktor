class Solution:
    def orangesRotting(self, grid):
        rows = len(grid)
        cols = len(grid[0])
        queue = []
        fresh = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == 2:
                    queue.append([r, c, 0])
                if grid[r][c] == 1:
                    fresh = fresh + 1
        minutes = 0
        dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        head = 0
        cur_r = -1
        cur_c = -1
        while head < len(queue):
            cell = queue[head]
            head = head + 1
            cur_r = cell[0]
            cur_c = cell[1]
            t = cell[2]
            minutes = max(minutes, t)
            for d in dirs:
                nr = cur_r + d[0]
                nc = cur_c + d[1]
                if nr >= 0 and nr < rows and nc >= 0 and nc < cols and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh = fresh - 1
                    queue.append([nr, nc, t + 1])
        if fresh > 0:
            return -1
        return minutes
