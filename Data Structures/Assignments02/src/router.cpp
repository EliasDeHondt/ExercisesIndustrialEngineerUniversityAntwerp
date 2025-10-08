/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#include "router.hpp"

Router::Router(std::size_t capacity)
    : m_queue(), m_capacity(capacity)
{
}

bool Router::receive(const packet& p)
{
    if (m_queue.size() >= m_capacity) {
        return false;
    }
    m_queue.push(p);
    return true;
}

std::optional<packet> Router::send()
{
    if (m_queue.empty()) {
        return std::nullopt;
    }
    packet p = m_queue.front();
    m_queue.pop();
    return p;
}

const packet* Router::peek() const noexcept
{
    if (m_queue.empty()) {
        return nullptr;
    }
    return &m_queue.front();
}

void Router::clear()
{
    while(!m_queue.empty()) {
        m_queue.pop();
    }
}