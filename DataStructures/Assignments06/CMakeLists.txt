cmake_minimum_required(VERSION 3.21)
project(06_graphs)

set(CMAKE_CXX_STANDARD 17)

# Header-only implementations live under include/, but we still provide a tiny library for structure
add_library(GraphLib STATIC
    src/graphlib.cpp
)

target_include_directories(GraphLib PUBLIC include)

if (MSVC)
    target_compile_options(GraphLib PRIVATE /W4 /permissive-)
else()
    target_compile_options(GraphLib PRIVATE -Wall -Wextra -Wpedantic)
endif()

add_executable(TestSuite
    test/main.cpp
    test/graph_basic.cpp
    test/dijkstra_astar.cpp
)

# Include this assignment's headers and reuse Catch2 headers from a previous assignment to avoid duplication
target_include_directories(TestSuite PRIVATE include
    ${CMAKE_CURRENT_SOURCE_DIR}/../Assignments05/include
)

target_link_libraries(TestSuite PRIVATE GraphLib)