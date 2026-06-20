class Solution:
    def twoSum(self, nums, target):
        result = []
        for i in range(len(nums)):
            first = nums[i]
            for j in range(i + 1, len(nums)):
                second = nums[j]
                current_sum = first + second
                if current_sum == target:
                    result = [i, j]
                    return result
