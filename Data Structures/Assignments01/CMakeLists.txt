cmake_minimum_required(VERSION 3.21)
project(02_lists_iterators)

set(CMAKE_CXX_STANDARD 17)

#
#	We will put our functions in a library.
#	Static libraries are usually slightly easier to work with, so we make this a "STATIC" library.
#	Then, we just provide a list of all the source files that make up this library.
#
add_library(ListLib STATIC
        src/01_lists_iterators/iterator_functions.cpp
        src/01_lists_iterators/name_generation.cpp
)

# Finally, we tell CMake we want ListLib to be able to access the headers under "./include/"
# Note that we can safely omit the current directory ("./")
target_include_directories(ListLib PRIVATE "include/")

#
# We also create an executable for our unit tests.
# This has a "main" file where Catch 2 will supply our main function, and the source files for our actual tests.
#
add_executable(TestSuite
        test/main.cpp
        test/name_generation.cpp
)

# Similar to what we did earlier, we tell CMake where "TestSuite" is supposed to find our headers
target_include_directories(TestSuite PRIVATE "include/")

# We also tell CMake we want to link "TestSuite" against "ListLib"
# This is essentially telling CMake that "TestSuite" will be calling some code from "ListLib", and thus,
# "ListLib" should be a part of "TestSuite"
target_link_libraries(TestSuite PRIVATE ListLib)