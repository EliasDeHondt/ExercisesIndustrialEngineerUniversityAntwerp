/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#pragma once

// A simple string wrapper with lexicographic ordering
// Represents the "baseline" implementation used as key in std::map

#include <string>
#include <iosfwd>

struct MyString1 {
    MyString1() = default;
    explicit MyString1(std::string s);

    // Rule of five defaults are fine since we only hold std::string
    MyString1(const MyString1&) = default;
    MyString1(MyString1&&) noexcept = default;
    MyString1& operator=(const MyString1&) = default;
    MyString1& operator=(MyString1&&) noexcept = default;
    ~MyString1() = default;

    const std::string& str() const noexcept { return value_; }

    // Order and equality for std::map
    friend bool operator<(const MyString1& a, const MyString1& b) noexcept {
        return a.value_ < b.value_;
    }
    friend bool operator==(const MyString1& a, const MyString1& b) noexcept {
        return a.value_ == b.value_;
    }

    friend std::ostream& operator<<(std::ostream& os, const MyString1& s);

private:
    std::string value_{};
};
