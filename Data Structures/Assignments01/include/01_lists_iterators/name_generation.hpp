/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#pragma once

#include <list>
#include <string>
#include <vector>
#include <cstdint>

// This is a helper function that generates a random name, using `seed` to seed the random number generator.
std::string generate_random_name(std::uint64_t seed);

// This function generates `n_names` names, using `seed` to seed the random number generator.
// Names are returned in a std::vector
std::vector<std::string> fill_vector(std::size_t n_names, std::uint64_t seed);

// This function generates `n_names` names, using `seed` to seed the random number generator.
// Names are returned in a std::list
std::list<std::string> fill_list(std::size_t n_names, std::uint64_t seed);
