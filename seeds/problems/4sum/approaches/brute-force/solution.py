class Solution:
    def fourSum(self, nums, target):
        nums.sort()
        n = len(nums)
        res = []
        for i in range(n):
            for j in range(i + 1, n):
                for k in range(j + 1, n):
                    for l in range(k + 1, n):
                        s = nums[i] + nums[j] + nums[k] + nums[l]
                        if s == target:
                            res.append([nums[i], nums[j], nums[k], nums[l]])
        return res
