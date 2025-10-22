/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include <catch2/catch.hpp>
#include "my_string1.hpp"
#include <map>

TEST_CASE("MyString1 basic ordering and equality") {
    MyString1 a{"apple"};
    MyString1 b{"banana"};
    MyString1 a2{"apple"};

    REQUIRE(a == a2);
    REQUIRE(a < b);
    REQUIRE_FALSE(b < a);
}

TEST_CASE("MyString1 works as std::map key") {
    std::map<MyString1, int> m;
    m.emplace(MyString1{"apple"}, 1);
    m.emplace(MyString1{"banana"}, 2);
    m.emplace(MyString1{"cherry"}, 3);

    REQUIRE(m.size() == 3);
    auto it = m.find(MyString1{"banana"});
    REQUIRE(it != m.end());
    REQUIRE(it->second == 2);
}
