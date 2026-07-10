class Solution:
    def spiralOrder(self, matrix):
        result = []
        m = len(matrix)
        n = len(matrix[0])
        seen = []
        for ri in range(m):
            seen_row = [False] * n
            seen.append(seen_row)
        directions = [[0, 1], [1, 0], [0, -1], [-1, 0]]
        row = 0
        col = 0
        d = 0
        for step in range(m * n):
            result.append(matrix[row][col])
            seen[row][col] = True
            next_row = row + directions[d][0]
            next_col = col + directions[d][1]
            out_of_bounds = next_row < 0 or next_row >= m or next_col < 0 or next_col >= n
            if out_of_bounds or seen[next_row][next_col]:
                d = (d + 1) % 4
                next_row = row + directions[d][0]
                next_col = col + directions[d][1]
            row = next_row
            col = next_col
        return result
