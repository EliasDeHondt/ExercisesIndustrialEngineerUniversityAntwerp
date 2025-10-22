/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include <chrono>
#include <iostream>
#include <map>
#include <random>
#include <string>
#include <vector>
#include <algorithm>

#include "my_string1.hpp"
#include "my_string2.hpp"

using Clock = std::chrono::steady_clock;
using ms = std::chrono::milliseconds;

static std::vector<std::string> make_keys(std::size_t n, std::mt19937_64& rng) {
    std::uniform_int_distribution<int> len_dist(12, 24);
    std::uniform_int_distribution<int> ch_dist('a', 'z');
    std::vector<std::string> keys;
    keys.reserve(n);
    for (std::size_t i = 0; i < n; ++i) {
        int L = len_dist(rng);
        std::string s;
        s.resize(static_cast<std::size_t>(L));
        for (int j = 0; j < L; ++j) s[static_cast<std::size_t>(j)] = static_cast<char>(ch_dist(rng));
        keys.emplace_back(std::move(s));
    }
    return keys;
}

int main(int argc, char** argv) {
    // Optional: seed override
    std::uint64_t seed = 42;
    if (argc >= 2) {
        try { seed = static_cast<std::uint64_t>(std::stoull(argv[1])); } catch (...) {}
    }
    std::mt19937_64 rng(seed);

    std::vector<std::size_t> sizes = {1000, 2000, 5000, 10000, 20000, 50000};

    std::cout << "type,operation,n,milliseconds" << '\n';

    for (std::size_t n : sizes) {
        auto keys = make_keys(n, rng);

        // Insertion timings
        {
            std::map<MyString1, int> m;
            auto t0 = Clock::now();
            for (std::size_t i = 0; i < n; ++i) {
                m.emplace(MyString1(keys[i]), static_cast<int>(i));
            }
            auto t1 = Clock::now();
            auto dt = std::chrono::duration_cast<ms>(t1 - t0).count();
            std::cout << "MyString1,insert," << n << ',' << dt << '\n';
        }

        {
            std::map<MyString2, int> m;
            auto t0 = Clock::now();
            for (std::size_t i = 0; i < n; ++i) {
                m.emplace(MyString2(keys[i]), static_cast<int>(i));
            }
            auto t1 = Clock::now();
            auto dt = std::chrono::duration_cast<ms>(t1 - t0).count();
            std::cout << "MyString2,insert," << n << ',' << dt << '\n';
        }

        // Lookup timings (look up all existing keys)
        {
            std::map<MyString1, int> m;
            for (std::size_t i = 0; i < n; ++i) m.emplace(MyString1(keys[i]), static_cast<int>(i));
            volatile int sink = 0; // prevent optimization
            auto t0 = Clock::now();
            for (std::size_t i = 0; i < n; ++i) {
                auto it = m.find(MyString1(keys[i]));
                if (it != m.end()) sink += it->second;
            }
            auto t1 = Clock::now();
            (void)sink;
            auto dt = std::chrono::duration_cast<ms>(t1 - t0).count();
            std::cout << "MyString1,lookup," << n << ',' << dt << '\n';
        }

        {
            std::map<MyString2, int> m;
            for (std::size_t i = 0; i < n; ++i) m.emplace(MyString2(keys[i]), static_cast<int>(i));
            volatile int sink = 0;
            auto t0 = Clock::now();
            for (std::size_t i = 0; i < n; ++i) {
                auto it = m.find(MyString2(keys[i]));
                if (it != m.end()) sink += it->second;
            }
            auto t1 = Clock::now();
            (void)sink;
            auto dt = std::chrono::duration_cast<ms>(t1 - t0).count();
            std::cout << "MyString2,lookup," << n << ',' << dt << '\n';
        }
    }

    return 0;
}