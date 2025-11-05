/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#pragma once

#include "graph.hpp"
#include <queue>
#include <unordered_map>
#include <limits>

namespace graphs {
    template <typename T>
    struct ShortestPathResult {
        std::unordered_map<T, double> dist;
        std::unordered_map<T, T> prev;
    };

    template <typename T, typename Hash = std::hash<T>, typename Eq = std::equal_to<T>>
    ShortestPathResult<T> dijkstra(const Graph<T, Hash, Eq>& g, const T& start) {
        ShortestPathResult<T> res;
        using QItem = std::pair<double, T>; // (distance, node)
        std::priority_queue<QItem, std::vector<QItem>, std::greater<QItem>> pq;

        res.dist[start] = 0.0;
        pq.emplace(0.0, start);

        while (!pq.empty()) {
            auto [du, u] = pq.top();
            pq.pop();
            if (du > res.dist[u]) continue; // stale queue entry

            for (const auto& [v, w] : g.neighbors(u)) {
                if (w < 0) continue; // ignore negative weights (not supported)
                double nd = du + w;
                if (!res.dist.count(v) || nd < res.dist[v]) {
                    res.dist[v] = nd;
                    res.prev[v] = u;
                    pq.emplace(nd, v);
                }
            }
        }
        return res;
    }

    template <typename T>
    std::vector<T> reconstruct_path(const ShortestPathResult<T>& res, const T& start, const T& goal) {
        std::vector<T> path;
        if (!res.dist.count(goal)) return path;
        T current = goal;
        while (true) {
            path.push_back(current);
            if (current == start) break;
            auto it = res.prev.find(current);
            if (it == res.prev.end()) { path.clear(); break; }
            current = it->second;
        }
        std::reverse(path.begin(), path.end());
        return path;
    }
}
