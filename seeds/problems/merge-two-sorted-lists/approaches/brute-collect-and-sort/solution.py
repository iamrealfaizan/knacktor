class Solution:
    def mergeTwoLists(self, list1, list2):
        combined = []
        for v in list1:
            combined.append(v)
        for v in list2:
            combined.append(v)
        combined.sort()
        result = combined
        return result
