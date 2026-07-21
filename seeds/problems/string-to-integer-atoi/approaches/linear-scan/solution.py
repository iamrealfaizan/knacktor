class Solution:
    def myAtoi(self, s):
        n = len(s)
        pos = 0
        while pos < n and s[pos] == " ":
            pos = pos + 1
        scan_start = pos
        sign = 1
        sign_idx = -1
        if pos < n and s[pos] == "-":
            sign = -1
            sign_idx = pos
            pos = pos + 1
        elif pos < n and s[pos] == "+":
            sign_idx = pos
            pos = pos + 1
        res = 0
        int_max = 2147483647
        int_min = -2147483648
        while pos < n and s[pos] >= "0" and s[pos] <= "9":
            digit = ord(s[pos]) - ord("0")
            if res > int_max // 10 or (res == int_max // 10 and digit > 7):
                if sign == 1:
                    res = int_max
                else:
                    res = int_min
                return res
            res = res * 10 + digit
            pos = pos + 1
        res = sign * res
        return res
