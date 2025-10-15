cmake_minimum_required(VERSION 3.15)
project(03_time_complexity CXX)

set(CMAKE_CXX_STANDARD 17)

#
#	We will put our sorting functions in a library.
#	Static libraries are usually slightly easier to work with, so we make this a "STATIC" library.
#	Then, we just provide a list of all the source files that make up this library.
#
add_library(SortLib STATIC
	"src/03_time_complexity/insertion_sort.cpp"
	"src/03_time_complexity/quick_sort.cpp"
)

# Finally, we tell CMake we want SortLib to be able to access the headers under "./include/"
# Note that we can safely omit the current directory ("./")
target_include_directories(SortLib PRIVATE "include/")

#
# We also create an executable for our unit tests.
# This has a "main" file where Catch 2 will supply our main function, and the source files for our actual tests.
#
add_executable(TestSuite
	"test/main.cpp"
	"test/insertion_sort.cpp"
	"test/quick_sort.cpp"
)

# Similar to what we did earlier, we tell CMake where "TestSuite" is supposed to find our headers
target_include_directories(TestSuite PRIVATE "include/")

# We also tell CMake we want to link "TestSuite" against "SortLib"
# This is essentially telling CMake that "TestSuite" will be calling some code from "SortLib", and thus,
# "SortLib" should be a part of "TestSuite"
target_link_libraries(TestSuite PRIVATE SortLib)

add_executable(Timer
	"src/01_time_complexity/timer.cpp"
)

# Similar to what we did earlier, we tell CMake where "Timer" is supposed to find our headers
target_include_directories(Timer PRIVATE "include/")

# Similar to what we did earlier, we tell CMake we want to link "Timer" against "SortLib"
target_link_libraries(Timer PRIVATE SortLib)