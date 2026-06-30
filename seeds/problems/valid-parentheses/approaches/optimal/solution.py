class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        pairs = {")": "(", "]": "[", "}": "{"}
        for c in s:
            if c in pairs:
                if not stack:
                    result = False
                    return result
                top = stack.pop()
                if top != pairs[c]:
                    result = False
                    return result
            else:
                stack.append(c)
        result = not stack
        return result
