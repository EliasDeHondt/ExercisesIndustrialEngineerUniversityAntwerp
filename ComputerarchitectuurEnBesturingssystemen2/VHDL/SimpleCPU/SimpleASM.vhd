-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2026

library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

package SimpleASM is
  -- Tip: 16#12# in VHDL betekent dat de 12 tussen de ## als hexadecimaal
  -- geinterpreteerd moet worden (de waarde achttien dus).
  -- Let dus op dat je bij langere code na adres #09# adres #0A# gebruikt en
  -- dat #10# pas na adres #0F# komt.
  -- 16#08# => ...
  -- 16#09# => ...
  -- 16#0A# => ...
  -- ...
  -- 16#0F# => ...
  -- 16#10# => ...
  -- ...
  -- Merk ook de 'others => "000...");' op aan het einde van de code, wat alle
  -- andere geheugenplaatsen op 0 zet. Moest je dus toch van 16#09# naar 16#10#
  -- gaan, dan bevatten de adressen 16#0A# t.e.m. 16#0F# allemaal 0'en.
  type t_Memory is array (0 to 255) of std_logic_vector(15 downto 0);
  constant c_MemInit : t_Memory := (
  ---------+----------------------+--------------------+
  -- ADDR  |   MACHINE LANGUAGE   |   ASM INSTRUCTION  |
  ---------+----------------------+--------------------+
  ---------------
  -- Opgave 1: --
  ---------------
    -- 16#00# => "0000000000000001", -- LOAD ACC 1
    -- 16#01# => "0101000010100000", -- WRITE MEM 0xA0
    -- 16#02# => "0101000010100001", -- WRITE MEM 0xA1
    -- 16#03# => "0010100010100000", -- ADD IND 0xA0
    -- 16#04# => "0101000010100000", -- WRITE MEM 0xA0
    -- 16#05# => "1001100000000111", -- JUMP C 7
    -- 16#06# => "1000000000000011", -- JUMP U 3
    -- 16#07# => "0100000010100001", -- READ MEM 0xA1
    -- 16#08# => "0010000000000010", -- ADD ACC 2
    -- 16#09# => "0101000010100001", -- WRITE MEM 0xA1
    -- 16#0A# => "1000000000000100", -- JUMP U 4
  ---------------
  -- Opgave 2: --
  ---------------
  -- reset the timer, step size 1 and start it
    16#00# => "0000000000110011", -- LOAD ACC 0x33
    16#01# => "0101000011111101", -- WRITE MEM 0xFD : write timer ctrl
  -- wait until the timer > 255
    16#02# => "0100000011111110", -- READ MEM 0xFE : timer MSB
    16#03# => "1001000000000010", -- JUMP Z 02 : if timer MSB = 0 => loop
  -- then increase memory address 10
    16#04# => "0100000000001010", -- READ MEM 10 : read mem address 10
    16#05# => "0010000000000001", -- ADD ACC 1
    16#06# => "0101000000001010", -- WRITE MEM 10
    16#07# => "1000000000000000", -- JUMP U 00

    others => "0000000000000000" -- the rest of the memory
    );
end SimpleASM;