/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include "my_string1.hpp"
#include <ostream>

MyString1::MyString1(std::string s) : value_(std::move(s)) {}

std::ostream& operator<<(std::ostream& os, const MyString1& s) {
    return os << s.str();
}
