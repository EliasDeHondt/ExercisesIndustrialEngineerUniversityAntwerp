/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#pragma once

#include "graph.hpp"
#include <queue>
#include <unordered_map>

namespace graphs {
    template <typename T>
    struct AStarResult {
        std::unordered_map<T, double> dist; // g-score (cost from start)
        std::unordered_map<T, T> prev;
    };

    template <typename T, typename Heuristic, typename Hash = std::hash<T>, typename Eq = std::equal_to<T>>
    AStarResult<T> astar(const Graph<T, Hash, Eq>& g, const T& start, const T& goal, Heuristic h) {
        using QItem = std::pair<double, T>; // (fScore, node)
        std::priority_queue<QItem, std::vector<QItem>, std::greater<QItem>> open;

        std::unordered_map<T, double> gScore; // cost so far
        std::unordered_map<T, double> fScore; // estimated total
        std::unordered_map<T, T> cameFrom;

        gScore[start] = 0.0;
        fScore[start] = h(start);
        open.emplace(fScore[start], start);

        while (!open.empty()) {
            auto [f, u] = open.top();
            open.pop();
            if (u == goal) {
                AStarResult<T> out{gScore, cameFrom};
                return out;
            }
            if (f > fScore[u]) continue; // stale

            for (const auto& [v, w] : g.neighbors(u)) {
                if (w < 0) continue; // ignore negative
                double tentative = gScore[u] + w;
                if (!gScore.count(v) || tentative < gScore[v]) {
                    cameFrom[v] = u;
                    gScore[v] = tentative;
                    fScore[v] = tentative + h(v);
                    open.emplace(fScore[v], v);
                }
            }
        }
        // If goal unreachable, return whatever we have
        AStarResult<T> out{gScore, cameFrom};
        return out;
    }
}