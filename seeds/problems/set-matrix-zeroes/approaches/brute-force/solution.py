class Solution:
    def setZeroes(self, matrix):
        rows = len(matrix)
        cols = len(matrix[0])
        original = []
        for source_row in matrix:
            original.append(source_row[:])
        for row in range(rows):
            for col in range(cols):
                if original[row][col] == 0:
                    for current_col in range(cols):
                        matrix[row][current_col] = 0
                    for current_row in range(rows):
                        matrix[current_row][col] = 0
        return matrix
