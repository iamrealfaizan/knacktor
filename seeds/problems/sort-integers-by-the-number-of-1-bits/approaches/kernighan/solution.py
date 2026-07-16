class Solution:
    def sortByBits(self, arr):
        n = len(arr)
        bit_counts = []
        i = 0
        while i < n:
            num = arr[i]
            count = 0
            while num > 0:
                num = num & (num - 1)
                count = count + 1
            bit_counts.append(count)
            i = i + 1
        i = 0
        while i < n:
            best = i
            j = i + 1
            while j < n:
                if bit_counts[j] < bit_counts[best]:
                    best = j
                elif bit_counts[j] == bit_counts[best]:
                    if arr[j] < arr[best]:
                        best = j
                j = j + 1
            temp = arr[i]
            arr[i] = arr[best]
            arr[best] = temp
            temp_bits = bit_counts[i]
            bit_counts[i] = bit_counts[best]
            bit_counts[best] = temp_bits
            i = i + 1
        return arr
