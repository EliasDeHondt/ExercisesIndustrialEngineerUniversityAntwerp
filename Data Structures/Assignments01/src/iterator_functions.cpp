/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include "iterator_functions.hpp"
#include <iostream>
#include <vector>
#include <algorithm>
#include <list>
#include <iterator>

template <typename IteratorType>
void print_names(IteratorType begin, IteratorType end)
{
    for (auto it = begin; it != end; ++it) {
        std::cout << *it << std::endl;
    }
}

template <typename InputIteratorType, typename OutputIteratorType>
void filter_prefixed_names(
        InputIteratorType begin,
        InputIteratorType end,
        std::string prefix,
        OutputIteratorType output_begin
)
{
    for (auto it = begin; it != end; ++it) {
        if (it->length() >= prefix.length() && 
            it->substr(0, prefix.length()) == prefix) {
            *output_begin = *it;
            ++output_begin;
        }
    }
}

template <typename IteratorType>
void print_reverse(IteratorType begin, IteratorType end)
{
    // Create reverse iterators from the forward iterators
    auto rbegin = std::reverse_iterator<IteratorType>(end);
    auto rend = std::reverse_iterator<IteratorType>(begin);
    
    for (auto it = rbegin; it != rend; ++it) {
        std::cout << *it << std::endl;
    }
}

// Explicit template instantiations for common iterator types
template void print_names<std::vector<std::string>::iterator>(
    std::vector<std::string>::iterator begin, 
    std::vector<std::string>::iterator end
);

template void print_names<std::list<std::string>::iterator>(
    std::list<std::string>::iterator begin, 
    std::list<std::string>::iterator end
);

template void filter_prefixed_names<std::vector<std::string>::iterator, std::vector<std::string>::iterator>(
    std::vector<std::string>::iterator begin,
    std::vector<std::string>::iterator end,
    std::string prefix,
    std::vector<std::string>::iterator output_begin
);

template void filter_prefixed_names<std::list<std::string>::iterator, std::list<std::string>::iterator>(
    std::list<std::string>::iterator begin,
    std::list<std::string>::iterator end,
    std::string prefix,
    std::list<std::string>::iterator output_begin
);

template void print_reverse<std::vector<std::string>::iterator>(
    std::vector<std::string>::iterator begin, 
    std::vector<std::string>::iterator end
);

template void print_reverse<std::list<std::string>::iterator>(
    std::list<std::string>::iterator begin, 
    std::list<std::string>::iterator end
);