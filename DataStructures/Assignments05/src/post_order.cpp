/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include "post_order.hpp"

namespace {
    void post_order_impl(const Node* n, std::vector<int>& out) {
        if (!n) return;
        post_order_impl(n->left, out);
        post_order_impl(n->right, out);
        out.push_back(n->data);
    }
}

std::vector<int> post_order(const Node* root) {
    std::vector<int> out;
    post_order_impl(root, out);
    return out;
}