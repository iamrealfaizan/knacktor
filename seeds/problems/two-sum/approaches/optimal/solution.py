class Solution:
    def twoSum(self, nums, target):
        num_map = {}
        result = []
        for i in range(len(nums)):
            num = nums[i]
            complement = target - num
            if complement in num_map:
                result = [num_map[complement], i]
                return result
            num_map[num] = i
