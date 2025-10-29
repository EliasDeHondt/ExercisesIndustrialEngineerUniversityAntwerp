/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include "post_order.hpp"
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

TEST_CASE("post_order, sample tree", "[postorder][tree]") {
    Node* root = build_sample_tree();
    const std::vector<int> expected{4,5,2,6,3,1};
    REQUIRE(post_order(root) == expected);
    delete_tree(root);
}