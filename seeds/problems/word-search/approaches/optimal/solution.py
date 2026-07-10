class Solution:
    def exist(self, board, word):
        m = len(board)
        n = len(board[0])
        answer = False
        for sr in range(m):
            for sc in range(n):
                if self.dfs(board, word, sr, sc, 0):
                    answer = True
                    return answer
        return answer

    def dfs(self, board, word, cr, cc, k):
        if k == len(word):
            return True
        if cr < 0 or cr >= len(board):
            return False
        if cc < 0 or cc >= len(board[0]):
            return False
        if board[cr][cc] != word[k]:
            return False
        temp = board[cr][cc]
        board[cr][cc] = '#'
        found = False
        if not found:
            if self.dfs(board, word, cr + 1, cc, k + 1):
                found = True
        if not found:
            if self.dfs(board, word, cr - 1, cc, k + 1):
                found = True
        if not found:
            if self.dfs(board, word, cr, cc + 1, k + 1):
                found = True
        if not found:
            if self.dfs(board, word, cr, cc - 1, k + 1):
                found = True
        board[cr][cc] = temp
        return found
