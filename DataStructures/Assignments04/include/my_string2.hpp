/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#pragma once

// An optimized string wrapper that caches a 64-bit hash for faster comparisons
// Provides strict weak ordering by comparing hash first, then lexicographically

#include <string>
#include <cstdint>
#include <iosfwd>

struct MyString2 {
    MyString2() = default;
    explicit MyString2(std::string s);

    MyString2(const MyString2&) = default;
    MyString2(MyString2&&) noexcept = default;
    MyString2& operator=(const MyString2&) = default;
    MyString2& operator=(MyString2&&) noexcept = default;
    ~MyString2() = default;

    const std::string& str() const noexcept { return value_; }
    std::uint64_t hash() const noexcept { return hash_; }

    friend bool operator<(const MyString2& a, const MyString2& b) noexcept {
        if (a.hash_ != b.hash_) return a.hash_ < b.hash_;
        return a.value_ < b.value_;
    }
    friend bool operator==(const MyString2& a, const MyString2& b) noexcept {
        return a.hash_ == b.hash_ && a.value_ == b.value_;
    }

    friend std::ostream& operator<<(std::ostream& os, const MyString2& s);

private:
    static std::uint64_t fnv1a64(const std::string& s) noexcept;

    std::string value_{};
    std::uint64_t hash_ = 0;
};
