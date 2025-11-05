/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#pragma once

#include "graph.hpp"
#include <unordered_set>

namespace graphs {
    namespace detail {
        template <typename T, typename Hash, typename Eq>
        void dfs_recursive(const Graph<T, Hash, Eq>& g, const T& u, std::unordered_set<T, Hash, Eq>& visited, std::vector<T>& order) {
            visited.insert(u);
            order.push_back(u);
            for (const auto& [v, w] : g.neighbors(u)) {
                (void)w;
                if (visited.find(v) == visited.end()) {
                    dfs_recursive(g, v, visited, order);
                }
            }
        }
    }

    template <typename T, typename Hash = std::hash<T>, typename Eq = std::equal_to<T>>
    std::vector<T> dfs(const Graph<T, Hash, Eq>& g, const T& start) {
        std::vector<T> order;
        if (!g.has_vertex(start)) return order;
        std::unordered_set<T, Hash, Eq> visited;
        detail::dfs_recursive(g, start, visited, order);
        return order;
    }
}