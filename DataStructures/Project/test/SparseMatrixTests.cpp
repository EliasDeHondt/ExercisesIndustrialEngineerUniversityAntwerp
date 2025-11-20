/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include <gtest/gtest.h>
#include "../lib/SparseMatrix.h"

using namespace std;

void printMatrixInfo(const SparseMatrix<double>& m) {
    cout << "\n[Matrix Info]\n";
    cout << "Rows: " << m.rows() << "\n";
    cout << "Cols: " << m.columns() << "\n";
    cout << "Non-zero count: " << m.non_zero_count() << "\n";
    cout << "Sparsity: " << m.sparsity() * 100 << "%\n";
}

// ============================================================
// This test shows: “How much memory would this use as a regular matrix vs. sparse?”
TEST(SparseMatrixAnalysis, CompressionEfficiency) {
    SparseMatrix<double> m(1000, 1000);

    m(0, 0) = 1;
    m(500, 123) = 2;
    m(999, 999) = 3;

    cout << "\n[Test] CompressionEfficiency\n";
    printMatrixInfo(m);

    size_t dense_cells = m.rows() * m.columns();
    size_t sparse_cells = m.non_zero_count();

    cout << "Dense cell count: " << dense_cells << "\n";
    cout << "Sparse stored cells: " << sparse_cells << "\n";

    EXPECT_EQ(sparse_cells, 3);
    EXPECT_EQ(dense_cells, 1'000'000);
}
// ============================================================
// Sparse matrix cannot store 0 values
TEST(SparseMatrixBehavior, ZeroRemovesElement) {
    SparseMatrix<double> m(5, 5);

    m(2, 2) = 9.0;
    EXPECT_EQ(m.non_zero_count(), 1);

    m(2, 2) = 0.0;

    cout << "\n[Test] ZeroRemovesElement\n";
    printMatrixInfo(m);

    EXPECT_EQ(m.non_zero_count(), 0);
    EXPECT_EQ(m(2, 2), 0.0);
}
// ============================================================
// Important: For a sparse matrix, copying must correctly duplicate the internal structure.
TEST(SparseMatrixCopy, DeepCopyCheck) {
    SparseMatrix<double> m1(3, 3);
    m1(0, 0) = 5;
    m1(1, 2) = 7;

    SparseMatrix<double> m2 = m1;

    cout << "\n[Test] DeepCopyCheck\n";
    printMatrixInfo(m2);

    EXPECT_EQ(m2(0, 0), 5);
    EXPECT_EQ(m2(1, 2), 7);
    EXPECT_EQ(m2.non_zero_count(), 2);

    m1(0, 0) = 99;
    EXPECT_EQ(m2(0, 0), 5);
}
// ============================================================