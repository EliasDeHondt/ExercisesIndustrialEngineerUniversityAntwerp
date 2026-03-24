-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2026

library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;
use work.SimpleASM.all;

entity Memory is
  port (
    Clk     : in  std_logic;                      -- System clock
    Reset   : in  std_logic;                      -- Synchronous active high
    Addr    : in  unsigned (7 downto 0);          -- Memory address
    DataOut : out std_logic_vector (15 downto 0); -- Data from memory
    DataIn  : in  std_logic_vector (15 downto 0); -- Data to memory
    WE      : in  std_logic);                     -- Active high memory write enable
end Memory;

architecture RTL of Memory is
  signal Mem : t_Memory := c_MemInit; -- The type t_Memory and the constant c_MemInit are defined in the package SimpleASM
begin
  p_Main: process (Clk)
  begin
    if rising_edge(Clk) then
      if Reset = '1' then
        DataOut <= (others => '0');
      else
        DataOut <= Mem(to_integer(unsigned(Addr))); -- Show the stored data at this address
        if WE = '1' then -- Write access
          Mem(to_integer(Addr)) <= DataIn; -- Store the data
          DataOut <= DataIn; -- Show the written data instead of the previously stored data
        end if;
      end if;
    end if;
  end process p_Main;
end RTL;