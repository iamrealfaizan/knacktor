class Solution:
    def fourSum(self, nums, target):
        nums.sort()
        n = len(nums)
        res = []
        for i in range(n - 3):
            for j in range(i + 1, n - 2):
                lo = j + 1
                hi = n - 1
                while lo < hi:
                    s = nums[i] + nums[j] + nums[lo] + nums[hi]
                    if s == target:
                        res.append([nums[i], nums[j], nums[lo], nums[hi]])
                        lo += 1
                        hi -= 1
                    elif s < target:
                        lo += 1
                    else:
                        hi -= 1
        return res
