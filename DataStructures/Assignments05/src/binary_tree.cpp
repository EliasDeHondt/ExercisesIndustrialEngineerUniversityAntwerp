/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include "binary_tree.hpp"

Node* make_node(int value, Node* left, Node* right) {
    return new Node(value, left, right);
}

void delete_tree(Node* root) {
    if (!root) return;
    delete_tree(root->left);
    delete_tree(root->right);
    delete root;
}