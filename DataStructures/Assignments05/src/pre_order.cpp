/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include "pre_order.hpp"

namespace {
    void pre_order_impl(const Node* n, std::vector<int>& out) {
        if (!n) return;
        out.push_back(n->data);
        pre_order_impl(n->left, out);
        pre_order_impl(n->right, out);
    }
}

std::vector<int> pre_order(const Node* root) {
    std::vector<int> out;
    pre_order_impl(root, out);
    return out;
}