############################
# @author EliasDH Team     #
# @see https://eliasdh.com #
# @since 01/01/2025        #
############################

include(FetchContent)

FetchContent_Declare(
    googletest
    GIT_REPOSITORY https://github.com/google/googletest.git
    GIT_TAG v1.14.0
)

set(gtest_force_shared_crt ON CACHE BOOL "Use shared (DLL) run-time library even with static libraries" FORCE)

FetchContent_MakeAvailable(googletest)

add_executable(SparseMatrixTests SparseMatrixTests.cpp)

target_link_libraries(SparseMatrixTests 
    gtest_main 
    SparseMatrix
)

target_include_directories(SparseMatrixTests PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/../lib)

include(CTest)
add_test(NAME SparseMatrixTest COMMAND SparseMatrixTests)