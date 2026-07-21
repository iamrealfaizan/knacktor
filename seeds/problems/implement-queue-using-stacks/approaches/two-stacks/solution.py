class Solution:
    def processOperations(self, operations, values):
        in_stack = []
        out_stack = []
        results = []
        op_index = 0
        current_op = ""
        moved = 0
        while op_index < len(operations):
            current_op = operations[op_index]
            if current_op == "push":
                in_stack.append(values[op_index])
                results.append(None)
            if current_op == "pop" or current_op == "peek":
                if len(out_stack) == 0:
                    while len(in_stack) > 0:
                        out_stack.append(in_stack.pop())
                        moved = moved + 1
            if current_op == "pop":
                results.append(out_stack.pop())
            if current_op == "peek":
                results.append(out_stack[len(out_stack) - 1])
            if current_op == "empty":
                results.append(len(in_stack) == 0 and len(out_stack) == 0)
            op_index = op_index + 1
        return results
