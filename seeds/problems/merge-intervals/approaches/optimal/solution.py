class Solution:
    def merge(self, intervals):
        intervals.sort()
        merged = []
        for i in range(len(intervals)):
            start = intervals[i][0]
            end = intervals[i][1]
            if len(merged) == 0:
                merged.append([start, end])
            else:
                last_end = merged[-1][1]
                if start > last_end:
                    merged.append([start, end])
                else:
                    if end > last_end:
                        merged[-1][1] = end
        return merged
