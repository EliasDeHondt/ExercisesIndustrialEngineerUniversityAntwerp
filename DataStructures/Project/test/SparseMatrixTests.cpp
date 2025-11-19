/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include <gtest/gtest.h>
#include "../lib/SparseMatrix.h" 

using namespace std;

class SparseMatrixTest : public ::testing::Test {
protected:
    SparseMatrix<double> m{3, 3}; 

    void SetUp() override {
        m(0, 0) = 1.0;
        m(1, 2) = 5.0;
        m(2, 1) = 2.0;
    }
};

TEST_F(SparseMatrixTest, QueryNormalCase) {
    EXPECT_EQ(m(0, 0), 1.0);
    EXPECT_EQ(m(0, 1), 0.0);
}

TEST_F(SparseMatrixTest, QueryEdgeCase_OutOfBounds) {
    EXPECT_THROW(m(3, 0), std::out_of_range);
    EXPECT_THROW(m(0, 3), std::out_of_range);
}

TEST_F(SparseMatrixTest, InsertNormalCase) {
    m(1, 1) = 9.9;
    EXPECT_EQ(m(1, 1), 9.9);
    m(0, 0) = 10.0;
    EXPECT_EQ(m(0, 0), 10.0);
}

TEST(MatrixMultiplicationTest, EdgeCase_IncompatibleShapes) {
    SparseMatrix<double> A(2, 3);
    SparseMatrix<double> B(4, 2);
    
    EXPECT_THROW(operator*(A, B), std::runtime_error);
}

TEST(MatrixMultiplicationTest, NormalCase) {
    SparseMatrix<double> A(2, 2);
    SparseMatrix<double> B(2, 2);
    
    A(0, 0) = 1.0;
    A(0, 1) = 2.0;
    A(1, 1) = 3.0;

    B(0, 0) = 4.0;
    B(1, 0) = 1.0;
    B(1, 1) = 5.0;

    SparseMatrix<double> C = operator*(A, B);

    EXPECT_EQ(C(0, 0), 6.0);
    EXPECT_EQ(C(0, 1), 10.0);
    EXPECT_EQ(C(1, 0), 3.0);
    EXPECT_EQ(C(1, 1), 15.0);
}

TEST_F(SparseMatrixTest, IteratorOverNonZeroElements) {
    int count = 0;
    for (auto it = m.begin(); it != m.end(); ++it) {
        count++;
    }
    EXPECT_EQ(count, 3); // Er zijn 3 non-zero elementen ingevoegd
}