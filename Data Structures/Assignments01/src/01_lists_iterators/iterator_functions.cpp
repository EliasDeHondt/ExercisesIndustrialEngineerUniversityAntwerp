/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include "01_lists_iterators/iterator_functions.hpp"
#include <iostream>
#include <vector>
#include <algorithm>
#include <list>

template <typename IteratorType>
void print_names(IteratorType begin, IteratorType end)
{
    // TODO: Fill this in!
}

template <typename InputIteratorType, typename OutputIteratorType>
void filter_prefixed_names(
        InputIteratorType begin,
        InputIteratorType end,
        std::string prefix,
        OutputIteratorType output_begin
)
{
    // TODO: Fill this in!
}

template <typename IteratorType>
void print_reverse(IteratorType begin, IteratorType end)
{
    // TODO: Fill this in!
}

// TODO: If you need explicit instantiations of the functions above, uncomment the code below!
// We will teach the templates course later in the course, so don't worry about this for now.
// If you want to learn more about templates, you can check out the following link:
// https://en.cppreference.com/w/cpp/language/templates