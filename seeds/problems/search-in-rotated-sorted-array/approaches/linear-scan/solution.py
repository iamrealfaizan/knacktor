class Solution:
    def search(self, nums, target):
        n = len(nums)
        answer = -1
        i = 0
        while i < n:
            if nums[i] == target:
                answer = i
                break
            i = i + 1
        return answer
