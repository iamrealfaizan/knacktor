class Solution:
    def maxProfit(self, prices):
        min_price = prices[0]
        max_profit = 0
        for i in range(len(prices)):
            price = prices[i]
            if price < min_price:
                min_price = price
            profit = price - min_price
            if profit > max_profit:
                max_profit = profit
        return max_profit
