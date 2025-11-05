/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include <catch2/catch.hpp>
#include "graph.hpp"
#include "dijkstra.hpp"
#include "astar.hpp"

using namespace graphs;

TEST_CASE("Dijkstra and A* shortest paths") {
    Graph<int> g;
    auto add = [&](int u, int v, double w) { g.add_edge(u, v, w, false); };

    add(1, 2, 1.0);
    add(1, 3, 4.0);
    add(2, 3, 2.0);
    add(2, 4, 5.0);
    add(3, 4, 1.0);
    add(4, 5, 3.0);

    auto res = dijkstra(g, 1);
    REQUIRE(res.dist.at(1) == Approx(0.0));
    REQUIRE(res.dist.at(5) == Approx(7.0));
    auto path = reconstruct_path(res, 1, 5);
    REQUIRE(path == std::vector<int>{1, 2, 3, 4, 5});

    auto h = [](int) { return 0.0; }; // admissible, reduces to Dijkstra
    auto ares = astar(g, 1, 5, h);
    REQUIRE(ares.dist.at(5) == Approx(7.0));
    auto apath = reconstruct_path(ShortestPathResult<int>{ares.dist, ares.prev}, 1, 5);
    REQUIRE(apath == std::vector<int>{1, 2, 3, 4, 5});
}
