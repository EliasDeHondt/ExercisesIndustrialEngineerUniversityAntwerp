cmake_minimum_required(VERSION 3.21)
project(Assignments01)

set(CMAKE_CXX_STANDARD 17)

add_library(ListLib STATIC
        src/iterator_functions.cpp
        src/name_generation.cpp
)

target_include_directories(ListLib PRIVATE "include/")

add_executable(TestSuite
        test/main.cpp
        test/name_generation.cpp
)

target_include_directories(TestSuite PRIVATE "include/")

target_link_libraries(TestSuite PRIVATE ListLib)