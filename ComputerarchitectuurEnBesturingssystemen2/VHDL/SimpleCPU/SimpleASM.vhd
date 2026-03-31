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

    -- Opgave 1: --
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


    -- Opgave 2: --
    -- 16#00# => "0000000000110011", -- LOAD ACC 0x33
    -- 16#01# => "0101000011111101", -- WRITE MEM 0xFD : write timer ctrl
    -- 16#02# => "0100000011111110", -- READ MEM 0xFE : timer MSB
    -- 16#03# => "1001000000000010", -- JUMP Z 02 : if timer MSB = 0 => loop
    -- 16#04# => "0100000000001010", -- READ MEM 10 : read mem address 10
    -- 16#05# => "0010000000000001", -- ADD ACC 1
    -- 16#06# => "0101000000001010", -- WRITE MEM 10
    -- 16#07# => "1000000000000000", -- JUMP U 00


    -- Opgave 3: BitOr en BitOrZ test --
    16#00# => "0000000011110000", -- LOAD ACC 0xF0
    16#01# => "1100000000001111", -- BITOR ACC 0x0F (0xF0 | 0x0F = 0xFF)
    16#02# => "0101000010100000", -- WRITE MEM 0xA0 : result moet 0xFF zijn
    16#03# => "0000000000000000", -- LOAD ACC 0x00 (clear accumulator)
    16#04# => "1101000011110000", -- BITORZ ACC 0xF0 (should NOT execute, Z=0)
    16#05# => "0101000010100001", -- WRITE MEM 0xA1 : result moet 0x00 zijn (unchanged)
    16#06# => "0000000011111111", -- LOAD ACC 0xFF
    16#07# => "1001000000001001", -- JUMPZ 9 (jump because result is 0xFF... wacht, ACC=0xFF dus ZF moet 0 zijn)
    16#08# => "1000000000001100", -- JUMP U 12 (unconditional jump, skip next)
    16#09# => "0000000000000001", -- LOAD ACC 0x01 (if jumped to 9, set ACC to 1)
    16#0A# => "1001000000001011", -- JUMPZ 11 (should NOT jump because Z=0 after LOAD 1)
    16#0B# => "0101000010100010", -- WRITE MEM 0xA2 : (if no jump) ACC=1 stored
    16#0C# => "0101000010100011", -- WRITE MEM 0xA3 : final marker

    others => "0000000000000000" -- the rest of the memory
    );
end SimpleASM;