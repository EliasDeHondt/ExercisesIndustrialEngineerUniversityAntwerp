![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍REPORT02🤍💙

## 📘Table of Contents

1. [📘Table of Contents](#📘table-of-contents)
2. [🖖Info](#🖖info)
3. [🔗Links](#🔗links)

---

## 🖖Info

1. In our **Router** class, can we replace both queues with a simple priority queue? Why, or why not?
> No, we cannot replace both queues with a simple priority queue. The reason is that a priority queue does not maintain the order of elements based on their insertion time, whereas a regular queue (FIFO) does. In our router, we need to preserve the order of packets as they arrive, which is not guaranteed with a priority queue.

2. In the **receive** method, you used std::optional to return **a value, or nothing**. The standard library also has a class for returning **one of many types** and **many types** in 1 object. What are they?
> std::variant is used for returning one of many types, while std::any is used for returning many types in one object.

3. `std::stack`, `std::queue` and `std::priority_queue` are container adaptors, while `std::vector`, `std::list` and `std::map` are containers. What is the difference between a container adaptor and a container? `std::list` and `std::map` are containers. What is the difference between a container adaptor and a container?
> A container is a data structure that holds a collection of objects, while a container adaptor is a wrapper around a container that provides a different interface or behavior. For example, `std::stack` is an adaptor that provides a LIFO interface on top of a container like `std::deque` or `std::vector`.

## 🔗Links
- 👯 Web hosting company [EliasDH.com](https://eliasdh.com).
- 📫 How to reach us elias.dehondt@outlook.com