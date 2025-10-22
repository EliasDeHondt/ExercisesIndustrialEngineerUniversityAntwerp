/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include <catch2/catch.hpp>
#include "my_string2.hpp"
#include <map>

TEST_CASE("MyString2 basic ordering and equality") {
    MyString2 a{"apple"};
    MyString2 b{"banana"};
    MyString2 a2{"apple"};

    REQUIRE(a == a2);
    // Ordering is not lexicographic necessarily (hash-first), but must be a strict weak ordering
    // We only verify that operator< produces a consistent order relation properties
    REQUIRE_FALSE(a < a);
    bool asym = (a < b) != (b < a);
    REQUIRE(asym);
}

TEST_CASE("MyString2 works as std::map key") {
    std::map<MyString2, int> m;
    m.emplace(MyString2{"apple"}, 1);
    m.emplace(MyString2{"banana"}, 2);
    m.emplace(MyString2{"cherry"}, 3);

    REQUIRE(m.size() == 3);
    auto it = m.find(MyString2{"banana"});
    REQUIRE(it != m.end());
    REQUIRE(it->second == 2);
}
