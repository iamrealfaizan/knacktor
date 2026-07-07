class Solution:
    def findMin(self, nums):
        n = len(nums)
        ans = nums[0]
        i = 0
        while i < n:
            if nums[i] < ans:
                ans = nums[i]
            i = i + 1
        return ans
