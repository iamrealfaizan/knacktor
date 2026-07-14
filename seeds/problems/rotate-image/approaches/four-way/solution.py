class Solution:
    def rotate(self, matrix):
        n = len(matrix)
        left = 0
        right = n - 1
        while left < right:
            for offset in range(right - left):
                top = left
                bottom = right
                top_left = matrix[top][left + offset]
                matrix[top][left + offset] = matrix[bottom - offset][left]
                matrix[bottom - offset][left] = matrix[bottom][right - offset]
                matrix[bottom][right - offset] = matrix[top + offset][right]
                matrix[top + offset][right] = top_left
            left += 1
            right -= 1
        return matrix
