############################
# @author EliasDH Team     #
# @see https://eliasdh.com #
# @since 01/01/2025        #
############################

cmake_minimum_required(VERSION 3.14)

project(SparseMatrixProject CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)
set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreadedDebugDLL" CACHE STRING "" FORCE)

if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    add_compile_options(-Wall -Wextra -Wpedantic -Werror)
elseif(CMAKE_CXX_COMPILER_ID MATCHES "MSVC")
    add_compile_options(/W4 /WX)
endif()

add_subdirectory(lib)
add_subdirectory(test)

add_executable(SparseMatrixDemo demo.cpp)
target_link_libraries(SparseMatrixDemo SparseMatrix)
target_include_directories(SparseMatrixDemo PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})