/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include "my_string2.hpp"
#include <ostream>

MyString2::MyString2(std::string s)
    : value_(std::move(s)), hash_(fnv1a64(value_)) {}

std::uint64_t MyString2::fnv1a64(const std::string& s) noexcept {
    // 64-bit FNV-1a hash
    // https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function
    const std::uint64_t FNV_OFFSET = 1469598103934665603ull;
    const std::uint64_t FNV_PRIME = 1099511628211ull;
    std::uint64_t h = FNV_OFFSET;
    for (unsigned char c : s) {
        h ^= static_cast<std::uint64_t>(c);
        h *= FNV_PRIME;
    }
    return h;
}

std::ostream& operator<<(std::ostream& os, const MyString2& s) {
    return os << s.str();
}
