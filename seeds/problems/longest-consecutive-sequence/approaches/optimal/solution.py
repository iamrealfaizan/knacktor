class Solution:
    def longestConsecutive(self, nums):
        numbers = set(nums)
        longest = 0
        for num in numbers:
            if num - 1 not in numbers:
                current = num
                current_length = 1
                while current + 1 in numbers:
                    current += 1
                    current_length += 1
                longest = max(longest, current_length)
        return longest
