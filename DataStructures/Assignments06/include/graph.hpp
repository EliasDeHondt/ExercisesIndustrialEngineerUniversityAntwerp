/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#pragma once

#include <unordered_map>
#include <unordered_set>
#include <vector>
#include <utility>

namespace graphs {
    template <typename T, typename Hash = std::hash<T>, typename Eq = std::equal_to<T>>
    class Graph {
    public:
        using vertex_type = T;
        using weight_type = double;
        using neighbor_list = std::vector<std::pair<T, weight_type>>;

        // Ensure a vertex exists in the adjacency structure
        void add_vertex(const T& v) {
            if (adj_.find(v) == adj_.end()) {
                adj_.emplace(v, neighbor_list{});
            }
        }

        // Add an edge; undirected by default
        void add_edge(const T& u, const T& v, weight_type w = 1.0, bool directed = false) {
            add_vertex(u);
            add_vertex(v);
            adj_[u].push_back({v, w});
            if (!directed) {
                adj_[v].push_back({u, w});
            }
        }

        bool has_vertex(const T& v) const { return adj_.find(v) != adj_.end(); }

        const neighbor_list& neighbors(const T& u) const {
            static const neighbor_list empty{};
            auto it = adj_.find(u);
            return it == adj_.end() ? empty : it->second;
        }

        std::vector<T> vertices() const {
            std::vector<T> vs;
            vs.reserve(adj_.size());
            for (const auto& kv : adj_) vs.push_back(kv.first);
            return vs;
        }

        const std::unordered_map<T, neighbor_list, Hash, Eq>& adjacency() const { return adj_; }

    private:
        std::unordered_map<T, neighbor_list, Hash, Eq> adj_;
    };
}
