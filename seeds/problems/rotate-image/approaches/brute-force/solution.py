class Solution:
    def rotate(self, matrix):
        n = len(matrix)
        rotated = []
        for _ in range(n):
            rotated.append([0] * n)
        for row in range(n):
            for col in range(n):
                rotated[col][n - 1 - row] = matrix[row][col]
        for row in range(n):
            for col in range(n):
                matrix[row][col] = rotated[row][col]
        return matrix
