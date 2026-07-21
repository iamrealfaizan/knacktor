class Solution:
    def floodFill(self, image, sr, sc, color):
        rows = len(image)
        cols = len(image[0])
        start_color = image[sr][sc]
        state = []
        for r in range(rows):
            state.append([0] * cols)
        cur_r = -1
        cur_c = -1
        dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        if start_color == color:
            return image
        queue = []
        queue.append([sr, sc])
        state[sr][sc] = 1
        image[sr][sc] = color
        while len(queue) > 0:
            cell = queue.pop(0)
            cur_r = cell[0]
            cur_c = cell[1]
            state[cur_r][cur_c] = 2
            for d in dirs:
                nr = cur_r + d[0]
                nc = cur_c + d[1]
                if nr >= 0 and nr < rows and nc >= 0 and nc < cols and image[nr][nc] == start_color:
                    state[nr][nc] = 1
                    image[nr][nc] = color
                    queue.append([nr, nc])
        return image
