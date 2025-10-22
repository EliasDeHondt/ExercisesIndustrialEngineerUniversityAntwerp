cmake_minimum_required(VERSION 3.21)
project(04_maps)

set(CMAKE_CXX_STANDARD 17)

# Create a STATIC library called "MapLib"
add_library(MapLib STATIC
		src/my_string1.cpp
		src/my_string2.cpp)

target_include_directories(MapLib PUBLIC include)

if (MSVC)
	target_compile_options(MapLib PRIVATE /W4 /permissive-)
else()
	target_compile_options(MapLib PRIVATE -Wall -Wextra -Wpedantic)
endif()

# Create an executable called "TestSuite"
add_executable(TestSuite
		test/main.cpp
		test/my_string1.cpp
		test/my_string2.cpp)

target_link_libraries(TestSuite PRIVATE MapLib)
target_include_directories(TestSuite PRIVATE include)

# Create an executable called "Measure"
add_executable(Measure src/measure.cpp)
target_link_libraries(Measure PRIVATE MapLib)
target_include_directories(Measure PRIVATE include)
