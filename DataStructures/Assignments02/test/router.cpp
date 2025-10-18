/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include <catch2/catch.hpp>

#include "router.hpp"

TEST_CASE("Router receives and sends packets in FIFO order") {
    Router r(5);
    REQUIRE(r.send() == std::nullopt);

    r.receive(create_packet("s1", "d1", "p1"));
    r.receive(create_packet("s2", "d2", "p2"));

    auto p1 = r.send();
    REQUIRE(p1.has_value());
    REQUIRE(p1->src == "s1");
    REQUIRE(p1->payload == "p1");

    auto p2 = r.send();
    REQUIRE(p2.has_value());
    REQUIRE(p2->src == "s2");
    REQUIRE(p2->payload == "p2");

    REQUIRE(r.send() == std::nullopt);
}

TEST_CASE("Router enforces capacity limit") {
    Router r(2);
    REQUIRE(r.receive(create_packet("a","b","1")) == true);
    REQUIRE(r.receive(create_packet("a","b","2")) == true);
    // third packet should be rejected
    REQUIRE(r.receive(create_packet("a","b","3")) == false);

    auto p1 = r.send();
    REQUIRE(p1.has_value());
    REQUIRE(p1->payload == "1");

    // after popping one, we can accept another
    REQUIRE(r.receive(create_packet("a","b","3")) == true);
}

TEST_CASE("Router peek and size/empty tracking") {
    Router r(3);
    REQUIRE(r.empty());
    REQUIRE(r.size() == 0);
    REQUIRE(r.peek() == nullptr);

    auto p1 = create_packet("s","d","alpha");
    r.receive(p1);
    REQUIRE_FALSE(r.empty());
    REQUIRE(r.size() == 1);
    auto frontPtr = r.peek();
    REQUIRE(frontPtr != nullptr);
    REQUIRE(frontPtr->payload == "alpha");

    r.receive(create_packet("s","d","beta"));
    REQUIRE(r.size() == 2);
    // peek should still show first
    auto again = r.peek();
    REQUIRE(again != nullptr);
    REQUIRE(again->payload == "alpha");

    // After send, peek changes
    r.send();
    auto after = r.peek();
    REQUIRE(after != nullptr);
    REQUIRE(after->payload == "beta");

    r.clear();
    REQUIRE(r.empty());
    REQUIRE(r.size() == 0);
    REQUIRE(r.peek() == nullptr);
}