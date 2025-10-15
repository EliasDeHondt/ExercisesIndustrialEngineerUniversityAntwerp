![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍REPORT01🤍💙

## 📘Table of Contents

1. [📘Table of Contents](#📘table-of-contents)
2. [🖖Info](#🖖info)
3. [🔗Links](#🔗links)

---

## 🖖Info

1. What are the differences between array-backed lists ([std::vector](https://en.cppreference.com/w/cpp/container/vector.html)) and linked lists ([std::forward_list](https://en.cppreference.com/w/cpp/container/forward_list.html) and [std::list](https://en.cppreference.com/w/cpp/container/list.html))? When would you use an array-backed list and when would you use a linked list?
> Array-backed lists provide fast random access to elements, while linked lists allow for efficient insertions and deletions. You would use an array-backed list when you need to frequently access elements by index, and a linked list when you need to frequently insert or delete elements.

2. Why do we need to be able to seed our random number generator?
> Seeding a random number generator ensures that the sequence of random numbers generated is reproducible. This is important for debugging and testing, as it allows you to recreate the same conditions and results.

3. The documentation for [std::vector::push_back](https://en.cppreference.com/w/cpp/container/vector/push_back) mentions that under certain conditions, all iterators and references are invalidated. What does this mean?
> This means that if the vector needs to resize its internal storage to accommodate new elements, any existing iterators or references to elements in the vector may no longer point to valid elements. This can lead to undefined behavior if you try to use them after a push_back operation that causes a reallocation.

4. We notice that almost every algorithm in the `<algorithm>` header takes a begin and end iterator as an argument. Why do you think the writers of the C++ standard chose to do this?
> This design allows algorithms to work with a wide variety of container types, as long as they provide iterators. It also makes the algorithms more flexible and easier to use, as you can easily specify the range of elements to operate on.

## 🔗Links
- 👯 Web hosting company [EliasDH.com](https://eliasdh.com).
- 📫 How to reach us elias.dehondt@outlook.com