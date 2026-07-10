class Solution:
    def coinChange(self, coins, amount):
        dp = [amount + 1] * (amount + 1)
        dp[0] = 0
        for a in range(1, amount + 1):
            for coin in coins:
                if coin <= a:
                    if dp[a - coin] + 1 < dp[a]:
                        dp[a] = dp[a - coin] + 1
        if dp[amount] > amount:
            result = -1
        else:
            result = dp[amount]
        return result
