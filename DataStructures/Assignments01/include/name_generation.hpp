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

std::string generate_random_name(std::uint64_t seed);

std::vector<std::string> fill_vector(std::size_t n_names, std::uint64_t seed);

std::list<std::string> fill_list(std::size_t n_names, std::uint64_t seed);