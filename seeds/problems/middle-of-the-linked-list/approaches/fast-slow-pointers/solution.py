class Solution:
    def middleNode(self, head):
        node_links = []
        i = 0
        while i < len(head):
            node_links.append(i + 1)
            i = i + 1
        node_links[len(head) - 1] = -1
        slow = 0
        fast = 0
        slow_from = 0
        fast_from = 0
        hops = 0
        result = []
        while fast != -1 and node_links[fast] != -1:
            fast_from = fast
            fast = node_links[fast]
            fast = node_links[fast]
            slow_from = slow
            slow = node_links[slow]
            hops = hops + 1
        result = head[slow:]
        return result
