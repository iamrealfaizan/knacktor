class Solution:
    def longestConsecutive(self, nums):
        if not nums:
            return 0
        nums.sort()
        current_count = 1
        max_count = 1
        for i in range(1, len(nums)):
            if nums[i] == nums[i - 1]:
                continue
            if nums[i] == nums[i - 1] + 1:
                current_count += 1
            else:
                current_count = 1
            max_count = max(max_count, current_count)
        return max_count
