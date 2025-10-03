cmake_minimum_required(VERSION 3.21)
project(02_lists_iterators)

set(CMAKE_CXX_STANDARD 17)

add_library(ListLib STATIC
        src/01_lists_iterators/iterator_functions.cpp
        src/01_lists_iterators/name_generation.cpp
)

target_include_directories(ListLib PRIVATE "include/")

add_executable(TestSuite
        test/main.cpp
        test/name_generation.cpp
)

target_include_directories(TestSuite PRIVATE "include/")

target_link_libraries(TestSuite PRIVATE ListLib)