![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍REPORT🤍💙

## 📘Table of Contents

1. [📘Table of Contents](#📘table-of-contents)
2. [🖖Info](#🖖info)
    1. [🤜Project Overview](#🤜project-overview)
    2. [🤜Build Instructions](#🤜build-instructions)
    3. [🤜Running the Program](#🤜running-the-program)
3. [🔗Links](#🔗links)

---

## 🖖Info

### 🤜Project Overview
What a Sparse Matrix Is Used For (and Why It Exists)
A sparse matrix is used in situations where you have a huge matrix, but most of its values are zero. Examples:

- Graphs and Networks:
    - Social networks
    - Road networks
    - Computer networks 
> These can be represented as adjacency matrices, but 99.999% of connections don’t exist → zeroes.

- Machine Learning & AI
    - Natural Language Processing (NLP)
    - Recommendation systems
    - Feature vectors that contain mostly zero data
> For example: a document-word matrix with 1 million possible words → most documents use only a few hundred words → the matrix is extremely sparse.

- COO Format
    - (row, col, value) tuples

### 🤜Build Instructions

To build the project, follow these steps:

```bash
mkdir build
cd build
cmake ..
cmake --build .
```

### 🤜Running the Program

**Run the demo program** (visualization of sparse matrices):
```bash
.\Debug\SparseMatrixDemo.exe
```

This displays two examples:
- A 5×5 matrix with 6 non-zero elements (76% sparse)
- A 15×15 matrix with 7 non-zero elements (96.89% sparse)

**Run the test suite** (validates all functionality):
```bash
.\test\Debug\SparseMatrixTests.exe
```

The test suite includes 6 comprehensive tests covering:
- Normal element queries and insertion
- Bounds checking and exception handling
- Iterator functionality
- Matrix multiplication with shape validation
- Edge cases and error conditions

## 🔗Links
- 👯 Web hosting company [EliasDH.com](https://eliasdh.com).
- 📫 How to reach us elias.dehondt@outlook.com