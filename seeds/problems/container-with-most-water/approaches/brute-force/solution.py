class Solution:
    def maxArea(self, height):
        n = len(height)
        mx = 0
        for i in range(n):
            for j in range(i + 1, n):
                h = min(height[i], height[j])
                w = j - i
                area = h * w
                mx = max(mx, area)
        return mx
