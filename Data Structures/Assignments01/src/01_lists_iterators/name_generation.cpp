/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include "01_lists_iterators/name_generation.hpp"
#include <cstdlib>
#include <random>
#include <string>

// You can write this helper function and use it in the functions below
std::string generate_random_name(std::uint64_t seed) {
    // Use the seed to create a deterministic random number generator
    std::mt19937 gen(seed);
    std::uniform_int_distribution<> dis(0, 25);
    
    // Generate a random name with 3-8 characters
    std::uniform_int_distribution<> length_dis(3, 8);
    int name_length = length_dis(gen);
    
    std::string name;
    name.reserve(name_length);
    
    // First character is uppercase
    name += static_cast<char>('A' + dis(gen));
    
    // Remaining characters are lowercase
    for (int i = 1; i < name_length; ++i) {
        name += static_cast<char>('a' + dis(gen));
    }
    
    return name;
}

std::vector<std::string> fill_vector(std::size_t n_names, std::uint64_t seed) { // Vector = Array List
    std::vector<std::string> names;
    names.reserve(n_names);

    // Generate each name with a different seed to ensure variety
    for (std::size_t i = 0; i < n_names; ++i) {
        names.push_back(generate_random_name(seed + i));
    }

    return names;
}

std::list<std::string> fill_list(std::size_t n_names, std::uint64_t seed) {
    std::list<std::string> names;

    // Generate each name with a different seed to ensure variety
    for (std::size_t i = 0; i < n_names; ++i) {
        names.push_back(generate_random_name(seed + i));
    }

    return names;
}