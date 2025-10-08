/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

#pragma once

#include <optional>
#include <queue>

#include "packet.hpp"

class Router
{
private:
	std::queue<packet> m_queue;
	std::size_t m_capacity;

public:
	// Construct router with a given capacity (maximum number of packets it can hold)
	explicit Router(std::size_t capacity = 10);

	// Receive a packet; returns true if the packet was enqueued, false if router is full
	bool receive(const packet& p);

	// Send (dequeue) a packet; returns optional<packet> which is empty when queue is empty
	std::optional<packet> send();

	// Inspect the next packet without removing it; returns nullptr if empty
	const packet* peek() const noexcept;

	// Number of packets currently queued
	std::size_t size() const noexcept { return m_queue.size(); }

	// True if queue is empty
	bool empty() const noexcept { return m_queue.empty(); }

	// Configured capacity
	std::size_t capacity() const noexcept { return m_capacity; }

	// Remove all queued packets
	void clear();
};