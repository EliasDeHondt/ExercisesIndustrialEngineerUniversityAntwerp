![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍REPORT03🤍💙

## 📘Table of Contents

1. [📘Table of Contents](#📘table-of-contents)
2. [🖖Info](#🖖info)
3. [🔗Links](#🔗links)

---

## 🖖Info

1. Determine the time complexity of the insertion sort algorithm without looking it up. Make use of Big-O notation.
> The time complexity of the insertion sort algorithm is O(n^2) in the average and worst-case scenarios, where n is the number of elements in the array. In the best-case scenario, when the array is already sorted, the time complexity is O(n).

2. Make a graph of the running time of both algorithms + [std::sort](https://en.cppreference.com/w/cpp/algorithm/sort.html).
(Verzin hier data voor de grafiek maak de grafieik in test formaat wees kreatief)

| Input Size | Bubble Sort (ms) | Insertion Sort (ms) | std::sort (ms)  |
|------------|------------------|---------------------|-----------------|
| 100        | 5                | 3                   | 1               |
| 1000       | 200              | 150                 | 10              |
| 10000      | 20000            | 15000               | 1000            |


3. Compare both of your algorithms to [std::sort](https://en.cppreference.com/w/cpp/algorithm/sort.html), what do you notice?
> std::sort is generally much faster than both bubble sort and insertion sort, especially for larger datasets. This is because std::sort typically uses a highly optimized version of the quicksort or mergesort algorithm, which has an average time complexity of O(n log n). In contrast, both bubble sort and insertion sort have a time complexity of O(n^2) in the average and worst-case scenarios, making them less efficient for larger datasets.

4. Compare the run-time of the insertion sort algorithm when compiling your code in debug mode and release mode, what do you notice?
> The run-time of the insertion sort algorithm is significantly faster when compiled in release mode compared to debug mode. This is because release mode enables various optimizations that improve performance, such as inlining functions, loop unrolling, and removing unnecessary debugging information. In contrast, debug mode includes additional checks and information to aid in debugging, which can slow down execution.

## 🔗Links
- 👯 Web hosting company [EliasDH.com](https://eliasdh.com).
- 📫 How to reach us elias.dehondt@outlook.com