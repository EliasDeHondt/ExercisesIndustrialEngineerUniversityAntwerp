############################
# @author EliasDH Team     #
# @see https://eliasdh.com #
# @since 01/01/2025        #
############################

add_library(SparseMatrix INTERFACE)

target_sources(SparseMatrix INTERFACE SparseMatrix.h)

target_include_directories(SparseMatrix INTERFACE 
    $<INSTALL_INTERFACE:include>
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}>
)