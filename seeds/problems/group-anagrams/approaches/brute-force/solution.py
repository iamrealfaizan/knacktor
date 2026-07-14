class Solution:
    def groupAnagrams(self, strs):
        groups = []
        used = [False] * len(strs)
        for i in range(len(strs)):
            if used[i]:
                continue
            current_group = [strs[i]]
            used[i] = True
            for j in range(i + 1, len(strs)):
                if used[j]:
                    continue
                sorted_i = sorted(strs[i])
                sorted_j = sorted(strs[j])
                is_anagram = sorted_i == sorted_j
                if is_anagram:
                    current_group.append(strs[j])
                    used[j] = True
            groups.append(current_group)
        return groups
