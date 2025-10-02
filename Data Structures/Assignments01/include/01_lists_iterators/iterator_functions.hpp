/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#pragma once

#include <string>

// This function prints names from between two iterators in normal order
template <typename IteratorType>
void print_names(IteratorType begin, IteratorType end);

// This function runs through all names between `begin` and `end`,
// and filters out all names that start with `prefix`.
// If a name matches, it is placed in `output_begin`, and `output_begin` is advanced by 1.
template <typename InputIteratorType, typename OutputIteratorType>
void filter_prefixed_names(
	InputIteratorType begin,
	InputIteratorType end,
	std::string prefix,
	OutputIteratorType output_begin
);

// This function prints names between begin and end in reverse order.
template <typename IteratorType>
void print_reverse(IteratorType begin, IteratorType end);
