cmake_minimum_required(VERSION 3.21)
project(05_binary_trees)

set(CMAKE_CXX_STANDARD 17)

# Library with tree and traversal implementations
add_library(TreeLib STATIC
	src/binary_tree.cpp
	src/breadth_first.cpp
	src/in_order.cpp
	src/post_order.cpp
	src/pre_order.cpp
)

target_include_directories(TreeLib PUBLIC include)

if (MSVC)
	target_compile_options(TreeLib PRIVATE /W4 /permissive-)
else()
	target_compile_options(TreeLib PRIVATE -Wall -Wextra -Wpedantic)
endif()

# Unit tests executable
add_executable(TestSuite
	test/main.cpp
	test/breadth_first.cpp
	test/in_order.cpp
	test/post_order.cpp
	test/pre_order.cpp
)

target_include_directories(TestSuite PRIVATE include)
target_link_libraries(TestSuite PRIVATE TreeLib)