class ListNode:
    def __init__(self, val=0, nxt=None):
        self.val = val
        self.next = nxt

class Solution:
    def removeElements(self, head, val):
        vals = head if head else []
        nodes_list = [ListNode(v) for v in vals]
        for k in range(len(nodes_list) - 1):
            nodes_list[k].next = nodes_list[k + 1]
        real_head = nodes_list[0] if nodes_list else None
        dummy = ListNode(0)
        dummy.next = real_head
        current = dummy
        nodes = [{'id': i, 'label': str(nodes_list[i].val)} for i in range(len(nodes_list))]
        links = [{'from': i, 'to': i + 1} for i in range(len(nodes_list) - 1)]
        changed_links = []
        node_ids = list(range(len(nodes_list)))
        id_map = {id(nodes_list[i]): i for i in range(len(nodes_list))}
        id_map[id(dummy)] = -1
        curr_id = -1
        while current.next is not None:
            curr_id = id_map.get(id(current), -1)
            next_id = id_map.get(id(current.next), -1)
            if current.next.val == val:
                skip_id = next_id
                after_id = id_map.get(id(current.next.next), None) if current.next.next else None
                current.next = current.next.next
                links = [lk for lk in links if lk['from'] != skip_id and lk['to'] != skip_id]
                nodes = [nd for nd in nodes if nd['id'] != skip_id]
                changed_links = [{'from': curr_id, 'to': after_id}] if after_id is not None else []
            else:
                current = current.next
                curr_id = id_map.get(id(current), -1)
                changed_links = []
        result_vals = []
        node = dummy.next
        while node:
            result_vals.append(node.val)
            node = node.next
        result = result_vals
        return result
