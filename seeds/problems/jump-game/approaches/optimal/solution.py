class Solution:
    def canJump(self, nums):
        farthest = 0
        n = len(nums)
        for i in range(n):
            if i > farthest:
                return False
            reach = i + nums[i]
            farthest = max(farthest, reach)
        return True
