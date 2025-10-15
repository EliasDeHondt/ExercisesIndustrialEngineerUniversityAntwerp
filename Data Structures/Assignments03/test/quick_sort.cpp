/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include <catch2/catch.hpp>
#include <algorithm>

#include <quick_sort.hpp>

TEST_CASE("quick_sort, sorted array", "[quick_sort][sorted]")
{
	const std::vector<int> input{1,2,3,4,5};
	const auto out = quick_sort(input);
	REQUIRE(out == input);
}

TEST_CASE("quick_sort, random array", "[quick_sort][random]")
{
	const std::vector<int> input{5,1,4,2,8,0,2};
	auto expected = input;
	std::sort(expected.begin(), expected.end());
	const auto out = quick_sort(input);
	REQUIRE(out == expected);
}

TEST_CASE("quick_sort, reversed array", "[quick_sort][reversed]")
{
	const std::vector<int> input{9,7,5,3,1};
	const std::vector<int> expected{1,3,5,7,9};
	const auto out = quick_sort(input);
	REQUIRE(out == expected);
}