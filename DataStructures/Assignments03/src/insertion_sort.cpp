/*
 * @author idlab
 * @date 16/08/2022
 */

#include <insertion_sort.hpp>

template <typename T>
std::vector<T> insertion_sort(const std::vector<T>& vector) noexcept
{
	// Create a copy so we don't mutate the input
	std::vector<T> result = vector;

	// Classic insertion sort (ascending)
	for (std::size_t i = 1; i < result.size(); ++i)
	{
		T key = result[i];
		std::size_t j = i;
		while (j > 0 && result[j - 1] > key)
		{
			result[j] = result[j - 1];
			--j;
		}
		result[j] = key;
	}

	return result;
}

// Explicit template instantiation for int
template std::vector<int> insertion_sort(const std::vector<int>&) noexcept;