class Solution:
    def removeCoveredIntervals(self, intervals):
        intervals.sort(key=lambda p: (p[0], -p[1]))
        count = 0
        prev_end = 0
        for i in range(len(intervals)):
            start = intervals[i][0]
            end = intervals[i][1]
            if end > prev_end:
                count += 1
                prev_end = end
        return count
