/**
    * @autor EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include <vector>
#include <map>
#include <utility>
#include <stdexcept>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <iostream>
#include <iomanip>
#include <sstream>

template<typename U> class SparseMatrix;
template<typename U> SparseMatrix<U> operator*(const SparseMatrix<U>& left, const SparseMatrix<U>& right);

template <typename ElementType>
class SparseMatrix
{
private:
    std::size_t rows_;
    std::size_t columns_;
    std::map<std::pair<std::size_t, std::size_t>, ElementType> coo_data_;

    void check_bounds(std::size_t row, std::size_t column) const {
        if (row >= rows_ || column >= columns_) {
            throw std::out_of_range("Indices out of matrix bounds.");
        }
    }

public:
    class Proxy
    {
    private:
        SparseMatrix<ElementType>* matrix_;
        std::size_t row_;
        std::size_t column_;

    public:
        Proxy(SparseMatrix<ElementType>* matrix, std::size_t r, std::size_t c)
            : matrix_(matrix), row_(r), column_(c) {}

        Proxy& operator=(const ElementType& value)
        {
            auto key = std::make_pair(row_, column_);

            if (value == ElementType{}) {
                auto it = matrix_->coo_data_.find(key);
                if (it != matrix_->coo_data_.end()) {
                    matrix_->coo_data_.erase(it);
                }
            } else {
                matrix_->coo_data_[key] = value;
            }
            return *this;
        }

        operator ElementType() const {
            matrix_->check_bounds(row_, column_); 

            const static ElementType zero_value{};
            auto it = matrix_->coo_data_.find({row_, column_});

            if (it != matrix_->coo_data_.end()) {
                return it->second;
            }

            return zero_value;
        }
    };
    
    using iterator = typename std::map<std::pair<std::size_t, std::size_t>, ElementType>::iterator;
    using const_iterator = typename std::map<std::pair<std::size_t, std::size_t>, ElementType>::const_iterator;

    SparseMatrix(std::size_t rows, std::size_t columns)
        : rows_(rows), columns_(columns)
    {
        if (rows == 0 || columns == 0) {
            throw std::invalid_argument("Matrix dimensions must be positive.");
        }
    }

    std::size_t rows() const { return rows_; }
    std::size_t columns() const { return columns_; }
    std::size_t non_zero_count() const { return coo_data_.size(); }

    double sparsity() const { 
        if (rows_ == 0 || columns_ == 0) return 1.0;
        return 1.0 - (static_cast<double>(coo_data_.size()) / (rows_ * columns_)); 
    }

    const ElementType& operator()(std::size_t row, std::size_t column) const
    {
        check_bounds(row, column);
        const static ElementType zero_value{}; 

        auto it = coo_data_.find({row, column});
        if (it != coo_data_.end()) {
            return it->second;
        }
        
        return zero_value;
    }

    Proxy operator()(std::size_t row, std::size_t column)
    {
        check_bounds(row, column);
        return Proxy(this, row, column);
    }

    auto begin() { return coo_data_.begin(); }
    auto end() { return coo_data_.end(); }

    auto begin() const { return coo_data_.cbegin(); }
    auto end() const { return coo_data_.cend(); }

    std::string visualize() const {
        std::ostringstream oss;
        oss << "\nSparseMatrix Visualization (" << rows_ << "x" << columns_ << "):\n";
        oss << "Sparsity: " << std::fixed << std::setprecision(2) << (sparsity() * 100) << "%\n";
        oss << "Non-zero elements: " << coo_data_.size() << "\n\n";

        for (std::size_t i = 0; i < rows_; ++i) {
            oss << "[ ";
            for (std::size_t j = 0; j < columns_; ++j) {
                auto it = coo_data_.find({i, j});
                if (it != coo_data_.end()) {
                    oss << std::setw(6) << std::fixed << std::setprecision(1) << it->second;
                } else {
                    oss << "    . ";
                }
                oss << " ";
            }
            oss << "]\n";
        }
        oss << "\nLegend: '.' = 0 (zero), numbers = non-zero values\n";
        return oss.str();
    }

    template<typename U>
    friend SparseMatrix<U> operator*(const SparseMatrix<U>& left, const SparseMatrix<U>& right);
};

template<typename U>
SparseMatrix<U> operator*(const SparseMatrix<U>& left, const SparseMatrix<U>& right)
{
    if (left.columns_ != right.rows_) {
        throw std::runtime_error("Matrix shapes are incompatible for multiplication.");
    }

    std::size_t N = left.rows_;
    std::size_t K = right.columns_;

    SparseMatrix<U> result(N, K);

    std::map<std::size_t, std::vector<std::pair<std::size_t, U>>> right_by_column;
    for (const auto& [coords, val] : right.coo_data_) {
        std::size_t r = coords.first;
        std::size_t c = coords.second;
        right_by_column[c].push_back({r, val});
    }

    for (const auto& left_entry : left.coo_data_) {
        std::size_t i = left_entry.first.first;
        std::size_t j = left_entry.first.second;
        U val_i_j = left_entry.second;

        for (std::size_t k = 0; k < K; ++k) {
            auto it = right_by_column.find(k);

            if (it != right_by_column.end()) {
                for (const auto& right_entry : it->second) {
                    std::size_t j_prime = right_entry.first;
                    U val_j_prime_k = right_entry.second;

                    if (j == j_prime) {
                        result(i, k) = result(i, k) + (val_i_j * val_j_prime_k);
                    }
                }
            }
        }
    }

    return result;
}