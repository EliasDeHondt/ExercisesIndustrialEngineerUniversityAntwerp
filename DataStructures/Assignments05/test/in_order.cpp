/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include "in_order.hpp"
#include <catch2/catch.hpp>
#include "binary_tree.hpp"

// Same sample tree as in BFS test
static Node* build_sample_tree() {
    Node* n4 = make_node(4);
    Node* n5 = make_node(5);
    Node* n6 = make_node(6);
    Node* n2 = make_node(2, n4, n5);
    Node* n3 = make_node(3, nullptr, n6);
    Node* n1 = make_node(1, n2, n3);
    return n1;
}

TEST_CASE("in_order, sample tree", "[inorder][tree]") {
    Node* root = build_sample_tree();
    const std::vector<int> expected{4,2,5,1,3,6};
    REQUIRE(in_order(root) == expected);
    delete_tree(root);
}