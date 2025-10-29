/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#pragma once

#include <vector>
#include "binary_tree.hpp"

// Level-order (breadth-first) traversal. Returns the visited node values.
std::vector<int> breadth_first(const Node* root);