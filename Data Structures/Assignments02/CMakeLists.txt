cmake_minimum_required(VERSION 3.21)
project(02_queues_stacks)

set(CMAKE_CXX_STANDARD 17)


# Create a STATIC library called PacketLib
add_library(PacketLib STATIC
	src/packet.cpp
	src/router.cpp
)

target_include_directories(PacketLib PRIVATE "include/")

# Create TestSuite executable from test sources
add_executable(TestSuite
	test/main.cpp
	test/packet.cpp
	test/router.cpp
)

target_include_directories(TestSuite PRIVATE "include/")

target_link_libraries(TestSuite PRIVATE PacketLib)
