class Solution:
    def mergeTwoLists(self, list1, list2):
        l1_rem = list(list1)
        l2_rem = list(list2)
        result = []
        splice_source = None
        splice_val = None
        while l1_rem and l2_rem:
            if l1_rem[0] <= l2_rem[0]:
                splice_source = "list1"
                splice_val = l1_rem[0]
                result.append(l1_rem.pop(0))
            else:
                splice_source = "list2"
                splice_val = l2_rem[0]
                result.append(l2_rem.pop(0))
        while l1_rem:
            splice_source = "list1"
            splice_val = l1_rem[0]
            result.append(l1_rem.pop(0))
        while l2_rem:
            splice_source = "list2"
            splice_val = l2_rem[0]
            result.append(l2_rem.pop(0))
        return result
