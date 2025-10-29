/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#pragma once

#include <cstddef>

// A very small binary tree node storing a single integer.
// We use raw pointers here for simplicity in the exercises.
// Helper functions are provided to construct and delete a tree.
struct Node {
    int data{0};
    Node* left{nullptr};
    Node* right{nullptr};

    Node() = default;
    explicit Node(int value, Node* l = nullptr, Node* r = nullptr)
        : data(value), left(l), right(r) {}
};

// Helper to allocate a new node (syntactic sugar for tests/examples)
Node* make_node(int value, Node* left = nullptr, Node* right = nullptr);

// Recursively frees all nodes in the tree rooted at 'root'.
// Safe to call with nullptr.
void delete_tree(Node* root);