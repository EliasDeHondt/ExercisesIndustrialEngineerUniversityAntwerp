/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include "breadth_first.hpp"

#include <queue>

std::vector<int> breadth_first(const Node* root) {
    std::vector<int> order;
    if (!root) return order;

    std::queue<const Node*> q;
    q.push(root);
    while (!q.empty()) {
        const Node* cur = q.front();
        q.pop();
        order.push_back(cur->data);
        if (cur->left) q.push(cur->left);
        if (cur->right) q.push(cur->right);
    }
    return order;
}