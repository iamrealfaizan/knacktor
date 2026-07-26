class Solution:
    def productExceptSelf(self, nums):
        n = len(nums)
        result = []
        for i in range(n):
            prod = 1
            for j in range(n):
                if j != i:
                    prod = prod * nums[j]
            result.append(prod)
        return result
