class Solution:
    def setZeroes(self, matrix):
        rows = len(matrix)
        cols = len(matrix[0])
        first_col_zero = False
        for row in range(rows):
            if matrix[row][0] == 0:
                first_col_zero = True
            for col in range(1, cols):
                if matrix[row][col] == 0:
                    matrix[row][0] = 0
                    matrix[0][col] = 0
        for row in range(1, rows):
            for col in range(1, cols):
                if matrix[row][0] == 0 or matrix[0][col] == 0:
                    matrix[row][col] = 0
        if matrix[0][0] == 0:
            for col in range(cols):
                matrix[0][col] = 0
        if first_col_zero:
            for row in range(rows):
                matrix[row][0] = 0
        return matrix
