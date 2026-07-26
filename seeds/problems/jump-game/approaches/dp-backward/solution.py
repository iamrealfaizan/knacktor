class Solution:
    def canJump(self, nums):
        n = len(nums)
        dp = [False] * n
        dp[n - 1] = True
        i = n - 2
        while i >= 0:
            reach = min(i + nums[i], n - 1)
            j = i + 1
            while j <= reach:
                if dp[j]:
                    dp[i] = True
                    break
                j = j + 1
            i = i - 1
        answer = dp[0]
        return answer
