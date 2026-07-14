class Solution:
    def rotate(self, matrix):
        n = len(matrix)
        for row in range(n):
            for col in range(row + 1, n):
                matrix[row][col], matrix[col][row] = matrix[col][row], matrix[row][col]
        for current_row in matrix:
            current_row.reverse()
        return matrix
