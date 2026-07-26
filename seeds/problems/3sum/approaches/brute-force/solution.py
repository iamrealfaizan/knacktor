class Solution:
    def threeSum(self, nums):
        nums.sort()
        n = len(nums)
        result = []
        for i in range(n):
            for j in range(i + 1, n):
                for k in range(j + 1, n):
                    total = nums[i] + nums[j] + nums[k]
                    if total == 0:
                        triple = [nums[i], nums[j], nums[k]]
                        if triple not in result:
                            result.append(triple)
        return result
