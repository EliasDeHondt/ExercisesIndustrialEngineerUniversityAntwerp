/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include <catch2/catch.hpp>
#include <algorithm>

#include <insertion_sort.hpp>

TEST_CASE("insertion_sort, sorted array", "[insertion_sort][sorted]")
{
	const std::vector<int> input{1,2,3,4,5};
	const auto out = insertion_sort(input);
	REQUIRE(out == input);
}

TEST_CASE("insertion_sort, random array", "[insertion_sort][random]")
{
	const std::vector<int> input{5,1,4,2,8,0,2};
	auto expected = input;
	std::sort(expected.begin(), expected.end());
	const auto out = insertion_sort(input);
	REQUIRE(out == expected);
}

TEST_CASE("insertion_sort, reversed array", "[insertion_sort][reversed]")
{
	const std::vector<int> input{9,7,5,3,1};
	const std::vector<int> expected{1,3,5,7,9};
	const auto out = insertion_sort(input);
	REQUIRE(out == expected);
}