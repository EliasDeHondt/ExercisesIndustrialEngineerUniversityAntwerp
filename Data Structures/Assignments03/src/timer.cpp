/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include <chrono>
#include <iostream>
#include <random>
#include <vector>
#include <cstdlib>   // getenv
#include <cstdint>

#include <insertion_sort.hpp>
#include <quick_sort.hpp>

// Declare a type alias for a sorting function
// Let's dissect the function pointer notation:
// The first `std::vector<int>` is the return type of the function
// After that, we have the function name, and an asterisk to mark it as a pointer between ().
// Since the function pointer here is just a type, and not an argument, we can omit the name, which gives us (*).
// If we were to use a function pointer as an argument to a function, we would want to name the argument,
// and we'd get something like (*function_pointer).
// Finally, between the final set of (), we get the argument list for the function, in this case,
// our function accepts 1 argument of type `const std::vector<int>&`, and again, names can be omitted here.
using sort_fn_t = std::vector<int>(*)(const std::vector<int>&);

long timed_sorting_function(
	sort_fn_t sort_fn,	// Pass a function pointer to the sorting function
	const std::vector<int>& input_data					// The input data
)
{
	// Start Time Measurement
	const auto start = std::chrono::high_resolution_clock::now();

	const std::vector<int> sorted = sort_fn(input_data);	// call the function that the function pointer points to,
															// to do the actual sorting.

	// End Time Measurement
	const auto end = std::chrono::high_resolution_clock::now();
	const auto ns = std::chrono::duration_cast<std::chrono::nanoseconds>(end - start).count();
	return static_cast<long>(ns);
}

std::vector<int> generate_input_data(std::size_t size)
{
	// Generate reproducible random data for fairness
	static std::mt19937 rng(42);
	std::uniform_int_distribution<int> dist(-1'000'000, 1'000'000);
	std::vector<int> data;
	data.reserve(size);
	for (std::size_t i = 0; i < size; ++i)
	{
		data.push_back(dist(rng));
	}
	return data;
}

int main()
{
	// We declare a list of function pointers, we can then iterate over this list and use each function
	const std::vector<sort_fn_t> sorting_functions = {
		insertion_sort,
		quick_sort
	};

	// Determine maximum size from environment (optional), defaults to 262144
	std::size_t max_size = 262144;
	if (const char* env_max = std::getenv("MAX_SIZE"))
	{
		char* endptr = nullptr;
		unsigned long long v = std::strtoull(env_max, &endptr, 10);
		if (endptr != env_max && v > 0)
		{
			max_size = static_cast<std::size_t>(v);
		}
	}

	// Iterate over a number of different array sizes
	for (std::size_t array_size = 4; array_size <= max_size; array_size *= 2)
	{
		// Generate a set of input data for each array size
		// NOTE! Its important to give both sorting algorithms the same data, so the comparison is fair
		const std::vector<int> input_data = generate_input_data(array_size);

		// Iterate over all sorting functions, and time each one.
		for (sort_fn_t sort_fn: sorting_functions)
		{
			const long sorting_time = timed_sorting_function(
				sort_fn,
				input_data
			);
			// Print the result as CSV: size,function,time_ns
			const char* name = (sort_fn == insertion_sort) ? "insertion_sort" : "quick_sort";
			std::cout << array_size << "," << name << "," << sorting_time << "\n";
		}
	}
}