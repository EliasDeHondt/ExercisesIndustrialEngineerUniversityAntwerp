/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#pragma once

#include <string>

struct packet {
    std::string src;
    std::string dest;
    std::string payload;
};

// Factory that creates a packet from source, destination and payload
inline packet create_packet(const std::string& src, const std::string& dest, const std::string& payload)
{
    return packet{src, dest, payload};
}