class Solution:
    def maxArea(self, height):
        n = len(height)
        mx = 0
        lp = 0
        rp = n - 1
        while lp < rp:
            h = min(height[lp], height[rp])
            w = rp - lp
            area = h * w
            mx = max(mx, area)
            if height[lp] < height[rp]:
                lp += 1
            else:
                rp -= 1
        return mx
