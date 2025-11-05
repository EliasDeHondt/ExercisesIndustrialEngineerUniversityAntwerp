/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#pragma once

#include "graph.hpp"
#include <queue>
#include <unordered_set>

namespace graphs {
    template <typename T, typename Hash = std::hash<T>, typename Eq = std::equal_to<T>>
    std::vector<T> bfs(const Graph<T, Hash, Eq>& g, const T& start) {
        std::vector<T> order;
        if (!g.has_vertex(start)) return order;

        std::unordered_set<T, Hash, Eq> visited;
        std::queue<T> q;
        visited.insert(start);
        q.push(start);

        while (!q.empty()) {
            T u = q.front();
            q.pop();
            order.push_back(u);
            for (const auto& [v, w] : g.neighbors(u)) {
                (void)w; // unused in BFS
                if (visited.find(v) == visited.end()) {
                    visited.insert(v);
                    q.push(v);
                }
            }
        }
        return order;
    }
}