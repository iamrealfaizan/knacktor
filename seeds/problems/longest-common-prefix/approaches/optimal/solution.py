class Solution:
    def longestCommonPrefix(self, strs):
        prefix = strs[0]
        for i in range(1, len(strs)):
            s = strs[i]
            starts_ok = prefix == s[0:len(prefix)]
            while len(prefix) > 0 and starts_ok == False:
                prefix = prefix[:-1]
                starts_ok = prefix == s[0:len(prefix)]
            if prefix == "":
                result = ""
                return result
        result = prefix
        return result
