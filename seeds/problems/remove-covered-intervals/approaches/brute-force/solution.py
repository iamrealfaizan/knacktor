class Solution:
    def removeCoveredIntervals(self, intervals):
        count = 0
        n = len(intervals)
        for i in range(n):
            covered = False
            a = intervals[i][0]
            b = intervals[i][1]
            for j in range(n):
                if i == j:
                    continue
                c = intervals[j][0]
                d = intervals[j][1]
                if c <= a and b <= d:
                    covered = True
                    break
            if not covered:
                count += 1
        return count
