class Solution:
    def evalRPN(self, tokens):
        stack = []
        operators = {"+", "-", "*", "/"}
        for token in tokens:
            if token in operators:
                b = stack.pop()
                a = stack.pop()
                if token == "+":
                    value = a + b
                elif token == "-":
                    value = a - b
                elif token == "*":
                    value = a * b
                else:
                    value = int(a / b)
                stack.append(value)
            else:
                value = int(token)
                stack.append(value)
        answer = stack[0]
        return answer
