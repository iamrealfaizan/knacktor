class Solution:
    def coinChange(self, coins, amount):
        inf = amount + 1
        memo = [inf] * (amount + 1)
        memo[0] = 0
        best = self.solve(coins, amount, memo, inf)
        if best >= inf:
            best = -1
        return best

    def solve(self, coins, amt, memo, inf):
        if amt == 0:
            return 0
        if memo[amt] != inf:
            return memo[amt]
        best = inf
        for c in coins:
            if c <= amt:
                sub = self.solve(coins, amt - c, memo, inf)
                cand = sub + 1
                if cand < best:
                    best = cand
        memo[amt] = best
        return best
