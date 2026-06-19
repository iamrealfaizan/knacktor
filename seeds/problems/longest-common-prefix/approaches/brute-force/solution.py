class Solution:
    def longestCommonPrefix(self, strs):
        prefix = ""
        first = strs[0]
        min_len = len(first)
        for k in range(len(strs)):
            s = strs[k]
            current_len = len(s)
            if current_len < min_len:
                min_len = current_len
        for i in range(min_len):
            ch = first[i]
            for j in range(1, len(strs)):
                current = strs[j]
                other = current[i]
                if other != ch:
                    result = prefix
                    return result
            prefix = prefix + ch
        result = prefix
        return result
