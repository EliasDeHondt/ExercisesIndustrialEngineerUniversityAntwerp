/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#pragma once

#include <string>

template <typename IteratorType>
void print_names(IteratorType begin, IteratorType end);

template <typename InputIteratorType, typename OutputIteratorType>
void filter_prefixed_names(
	InputIteratorType begin,
	InputIteratorType end,
	std::string prefix,
	OutputIteratorType output_begin
);

template <typename IteratorType>
void print_reverse(IteratorType begin, IteratorType end);