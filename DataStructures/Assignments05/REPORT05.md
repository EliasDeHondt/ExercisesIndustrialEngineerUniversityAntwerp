![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍REPORT05🤍💙

## 📘Table of Contents

1. [📘Table of Contents](#📘table-of-contents)
2. [🖖Info](#🖖info)
3. [🔗Links](#🔗links)

---

## 🖖Info

1. We can use a binary tree to represent a mathematical expression, which traversal method should we use to evaluate the expression? Why can’t we use the others?
> Post-order traversal (Left, Right, Root) is used to evaluate an expression tree. In a binary expression tree, internal nodes are operators and leaves are operands. Evaluating in post-order ensures both operands (subtrees) are fully evaluated before applying the operator at the parent, which matches how expressions are computed. In-order can produce human-readable infix notation but requires parentheses and precedence handling to evaluate correctly; naive in-order evaluation would apply operators too early or ambiguously. Pre-order and breadth-first similarly try to apply operators before their operand subtrees are available, so they don’t naturally yield correct evaluation without extra stacks/parentheses logic.


2. If you assume a sorted binary tree (Such as the one shown in the figure), what is the time-complexity of finding a node with a given value?
> For a Binary Search Tree (BST), lookup time is O(h), where h is the height of the tree. In a balanced BST, h ≈ ⌊log₂ n⌋, so average/typical complexity is O(log n). In the worst case (degenerate/unbalanced tree that behaves like a linked list), h = n − 1 and lookup degrades to O(n).

3. We can also use binary trees to build N-ary trees, how would you tackle this?
> Use the left-child/right-sibling (LC-RS) representation: for each node, store a pointer to its first child (as the “left” pointer) and a pointer to its next sibling (as the “right” pointer). The first-child pointer chains down a node’s children list, and the right-sibling pointer chains across siblings. This encodes any N-ary tree with only two pointers per node, enabling standard binary-tree algorithms to traverse general trees.

## 🔗Links
- 👯 Web hosting company [EliasDH.com](https://eliasdh.com).
- 📫 How to reach us elias.dehondt@outlook.com