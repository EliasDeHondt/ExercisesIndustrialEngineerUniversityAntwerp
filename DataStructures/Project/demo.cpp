/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include "lib/SparseMatrix.h"
#include <iostream>

int main() {
    std::cout << "\n";
    std::cout << "#################################################################\n";
    std::cout << "# SPARSE MATRIX DEMONSTRATION                                   #\n";
    std::cout << "# This project implements a memory-efficient sparse matrix      #\n";
    std::cout << "# that only stores non-zero elements using COO format.          #\n";
    std::cout << "#################################################################\n";


    std::cout << "\n";
    std::cout << "EXAMPLE 1: SMALL MATRIX (5x5)\n";
    std::cout << "\n";
    SparseMatrix<double> A(5, 5);
    A(0, 0) = 5.0;
    A(0, 4) = 3.0;
    A(2, 1) = 7.0;
    A(2, 3) = 2.0;
    A(4, 2) = 9.0;
    A(4, 4) = 1.0;
    std::cout << A.visualize();
    std::cout << "Statistics: " << A.non_zero_count() << " stored out of " << (A.rows() * A.columns()) << " elements (" << (A.sparsity() * 100) << "% sparse)\n";


    std::cout << "\n";
    std::cout << "EXAMPLE 2: LARGE MATRIX (15x15)\n";
    std::cout << "\n";
    SparseMatrix<double> B(15, 15);
    B(2, 1) = 2.3;
    B(5, 14) = 1.5;
    B(6, 8) = 3.7;
    B(10, 5) = 4.2;
    B(12, 11) = 5.1;
    B(14, 13) = 8.9;
    B(14, 14) = 9.5;
    std::cout << B.visualize();
    std::cout << "Statistics: " << B.non_zero_count() << " stored out of " << (B.rows() * B.columns()) << " elements (" << (B.sparsity() * 100) << "% sparse)\n";

    return 0;
}