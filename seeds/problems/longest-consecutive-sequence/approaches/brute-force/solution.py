class Solution:
    def longestConsecutive(self, nums):
        if not nums:
            return 0
        longest = 0
        for num in nums:
            current = num
            length = 1
            while current + 1 in nums:
                current += 1
                length += 1
            longest = max(longest, length)
        return longest
