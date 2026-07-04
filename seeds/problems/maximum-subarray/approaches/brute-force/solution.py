class Solution:
    def maxSubArray(self, nums):
        n = len(nums)
        max_sum = nums[0]
        for i in range(n):
            current_sum = 0
            for j in range(i, n):
                current_sum += nums[j]
                if current_sum > max_sum:
                    max_sum = current_sum
        return max_sum
