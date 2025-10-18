/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include <catch2/catch.hpp>
#include "name_generation.hpp"
#include <iostream>

TEST_CASE("fill_vector, Same Seed Yields Same Names", "[vector]") {
    const std::uint64_t seed = 12345;
    const std::size_t num_names = 5;
    
    // Generate names with the same seed twice
    auto names1 = fill_vector(num_names, seed);
    auto names2 = fill_vector(num_names, seed);
    
    // Check that the same number of names is returned
    REQUIRE(names1.size() == num_names);
    REQUIRE(names2.size() == num_names);
    
    // Check that the same names are generated with the same seed
    REQUIRE(names1 == names2);
    
    // Check that each name is not empty
    for (const auto& name : names1) {
        REQUIRE(!name.empty());
        REQUIRE(name.length() >= 3);
        REQUIRE(name.length() <= 8);
        // Check first character is uppercase
        REQUIRE((name[0] >= 'A' && name[0] <= 'Z'));
        // Check remaining characters are lowercase
        for (std::size_t i = 1; i < name.length(); ++i) {
            REQUIRE((name[i] >= 'a' && name[i] <= 'z'));
        }
    }
}

TEST_CASE("fill_list, Same Seed Yields Same Names", "[list]") {
    const std::uint64_t seed = 67890;
    const std::size_t num_names = 4;
    
    // Generate names with the same seed twice
    auto names1 = fill_list(num_names, seed);
    auto names2 = fill_list(num_names, seed);
    
    // Check that the same number of names is returned
    REQUIRE(names1.size() == num_names);
    REQUIRE(names2.size() == num_names);
    
    // Check that the same names are generated with the same seed
    REQUIRE(names1 == names2);
    
    // Check that each name is not empty and follows the expected format
    for (const auto& name : names1) {
        REQUIRE(!name.empty());
        REQUIRE(name.length() >= 3);
        REQUIRE(name.length() <= 8);
        // Check first character is uppercase
        REQUIRE((name[0] >= 'A' && name[0] <= 'Z'));
        // Check remaining characters are lowercase
        for (std::size_t i = 1; i < name.length(); ++i) {
            REQUIRE((name[i] >= 'a' && name[i] <= 'z'));
        }
    }
}