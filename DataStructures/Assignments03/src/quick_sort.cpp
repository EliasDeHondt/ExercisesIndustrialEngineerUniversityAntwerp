/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include <quick_sort.hpp>
#include <cstddef>
#include <functional>
#include <utility>

template <typename T>
std::vector<T> quick_sort(const std::vector<T>& vector) noexcept
{
    // Return a sorted copy without modifying input
    std::vector<T> data = vector;

    // Helper lambdas for quicksort (Lomuto partition)
    std::function<void(std::vector<T>&, std::size_t, std::size_t)> qs;
    qs = [&qs](std::vector<T>& arr, std::size_t lo, std::size_t hi) {
        if (hi <= lo) return;
        T pivot = arr[hi];
        std::size_t i = lo;
        for (std::size_t j = lo; j < hi; ++j)
        {
            if (arr[j] <= pivot)
            {
                std::swap(arr[i], arr[j]);
                ++i;
            }
        }
        std::swap(arr[i], arr[hi]);
        if (i > 0) qs(arr, lo, i - 1);
        qs(arr, i + 1, hi);
    };

    if (!data.empty())
    {
        qs(data, 0, data.size() - 1);
    }

    return data;
}

// Explicit template instantiation for int
template std::vector<int> quick_sort(const std::vector<int>&) noexcept;
