/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include "in_order.hpp"

namespace {
    void in_order_impl(const Node* n, std::vector<int>& out) {
        if (!n) return;
        in_order_impl(n->left, out);
        out.push_back(n->data);
        in_order_impl(n->right, out);
    }
}

std::vector<int> in_order(const Node* root) {
    std::vector<int> out;
    in_order_impl(root, out);
    return out;
}