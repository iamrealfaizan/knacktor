class Solution:
    def firstBadVersion(self, n, bad):
        versions = []
        v = 1
        while v <= n:
            versions.append(v)
            v = v + 1
        bad_index = bad - 1
        left = 0
        right = n - 1
        mid = 0
        probes = 0
        is_bad = False
        answer = 0
        while left < right:
            mid = left + (right - left) // 2
            probes = probes + 1
            is_bad = mid >= bad_index
            if is_bad:
                right = mid
            else:
                left = mid + 1
        answer = versions[left]
        return answer
