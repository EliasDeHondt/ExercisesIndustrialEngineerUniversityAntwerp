/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include <catch2/catch.hpp>
#include "graph.hpp"
#include "bfs.hpp"
#include "dfs.hpp"

using namespace graphs;

TEST_CASE("BFS and DFS on undirected graph") {
    Graph<int> g;
    g.add_edge(1, 2);
    g.add_edge(1, 3);
    g.add_edge(2, 4);
    g.add_edge(2, 5);
    g.add_edge(3, 6);

    auto bfs_order = bfs(g, 1);
    REQUIRE(bfs_order == std::vector<int>{1, 2, 3, 4, 5, 6});

    auto dfs_order = dfs(g, 1);
    REQUIRE(dfs_order == std::vector<int>{1, 2, 4, 5, 3, 6});
}