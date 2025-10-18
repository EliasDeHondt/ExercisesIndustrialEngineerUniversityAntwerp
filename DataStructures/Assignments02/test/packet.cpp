/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include <catch2/catch.hpp>

#include "packet.hpp"

TEST_CASE("create_packet constructs packet with correct fields") {
    auto p = create_packet("A", "B", "hello");
    REQUIRE(p.src == "A");
    REQUIRE(p.dest == "B");
    REQUIRE(p.payload == "hello");
}

TEST_CASE("create_packet with empty payload") {
    auto p = create_packet("src", "dst", "");
    REQUIRE(p.src == "src");
    REQUIRE(p.dest == "dst");
    REQUIRE(p.payload.empty());
}