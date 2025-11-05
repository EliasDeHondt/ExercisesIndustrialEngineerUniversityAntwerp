![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍REPORT06🤍💙

## 📘Table of Contents

1. [📘Table of Contents](#📘table-of-contents)
2. [🖖Info](#🖖info)
3. [🔗Links](#🔗links)

---

## 🖖Info

1. When would you use which graph representation? Why?
> - Adjacency list: best for sparse graphs (|E| ≪ |V|^2). Memory O(|V|+|E|), fast to iterate neighbors, typical for BFS/DFS/Dijkstra.
> - Adjacency matrix: best for dense graphs and O(1) edge-existence checks. Memory O(|V|^2). Useful when |V| is small or many edge lookups/updates are needed.
> - Edge list: compact and simple for algorithms that sort/filter edges (e.g., Kruskal). Memory O(|E|). Slower for neighbor queries or edge existence.


2. In the lab on binary trees, we implemented different tree-traversal algorithms (Depth-first and Breadth-first), we can also implement these algorithms for a graph, but we need to make some changes to the algorithm. Which changes?
> - Add a visited set to avoid infinite loops due to cycles.
> - Handle disconnected components: optionally loop over all vertices and start a new traversal for each unvisited node to cover the whole graph.
> - Respect edge direction (directed vs. undirected) when exploring neighbors.
> - Node visitation order depends on insertion order of neighbors; define or sort neighbor order if determinism is required.
> - For weighted graphs, BFS/DFS still ignore weights; shortest paths require algorithms like Dijkstra or A*.

3. What are the differences between A* and Dijkstra? Is one algorithm better than the other? Why?
> - Dijkstra expands nodes in order of current best known distance from the start; A* expands by f(n)=g(n)+h(n) (cost so far + heuristic estimate to goal).
> - With h(n)=0, A* reduces to Dijkstra. With an admissible and consistent heuristic, A* explores fewer nodes and is typically faster while remaining optimal.
> - A* requires a heuristic tailored to the domain; if the heuristic is poor (or inadmissible), it can be slow or suboptimal. Dijkstra does not need a heuristic and is guaranteed optimal for non-negative weights.
> - So: A* is generally better when you have a good heuristic and a specific goal; Dijkstra is preferable when no good heuristic exists or all-pairs/all-target distances are needed.

## 🔗Links
- 👯 Web hosting company [EliasDH.com](https://eliasdh.com).
- 📫 How to reach us elias.dehondt@outlook.com