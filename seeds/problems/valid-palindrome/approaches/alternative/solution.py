class Solution:
    def isPalindrome(self, s):
        filtered = []
        for ch in s:
            if ch.isalnum():
                filtered.append(ch.lower())
        left = 0
        right = len(filtered) - 1
        while left < right:
            if filtered[left] != filtered[right]:
                return False
            left += 1
            right -= 1
        return True
