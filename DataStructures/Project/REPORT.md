![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍REPORT🤍💙

## 📘Table of Contents

1. [📘Table of Contents](#📘table-of-contents)
2. [🖖Info](#🖖info)
3. [🔗Links](#🔗links)

---

## 🖖Info

### Project Overview
This project implements a **SparseMatrix** data structure using C++17 templates. A sparse matrix is a matrix that contains mostly zero elements, making it inefficient to store all values in a traditional 2D array. Instead, this implementation uses the **Coordinate (COO) format**, which only stores non-zero elements along with their row and column indices. This approach dramatically reduces memory consumption, especially for matrices with high sparsity (many zeros). For example, a 100×100 matrix that is 99% sparse only stores about 100 non-zero elements instead of 10,000, resulting in 99% memory savings.

### Build Instructions

To build the project, follow these steps:

```bash
mkdir build
cd build
cmake ..
cmake --build .
```

### Running the Program

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