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

    -- -- Opgave 3: BitOr en BitOrZ test --
    -- 16#00# => "0000000011110000", -- LOAD ACC 0xF0
    -- 16#01# => "1100000000001111", -- BITOR ACC 0x0F (0xF0 | 0x0F = 0xFF)
    -- 16#02# => "0101000010100000", -- WRITE MEM 0xA0 : result moet 0xFF zijn
    -- 16#03# => "0000000000000000", -- LOAD ACC 0x00 (clear accumulator)
    -- 16#04# => "1101000011110000", -- BITORZ ACC 0xF0 (should NOT execute, Z=0)
    -- 16#05# => "0101000010100001", -- WRITE MEM 0xA1 : result moet 0x00 zijn (unchanged)
    -- 16#06# => "0000000011111111", -- LOAD ACC 0xFF
    -- 16#07# => "1001000000001001", -- JUMPZ 9 (jump because result is 0xFF... wacht, ACC=0xFF dus ZF moet 0 zijn)
    -- 16#08# => "1000000000001100", -- JUMP U 12 (unconditional jump, skip next)
    -- 16#09# => "0000000000000001", -- LOAD ACC 0x01 (if jumped to 9, set ACC to 1)
    -- 16#0A# => "1001000000001011", -- JUMPZ 11 (should NOT jump because Z=0 after LOAD 1)
    -- 16#0B# => "0101000010100010", -- WRITE MEM 0xA2 : (if no jump) ACC=1 stored
    -- 16#0C# => "0101000010100011", -- WRITE MEM 0xA3 : final marker

    -- Opgave 4: Timer reset (zonder andere bits te wijzigen) --
    -- 16#00# => "0100000011111101", -- READ MEM 0xFD   : lees timer control register
    -- 16#01# => "1100000000000001", -- BITOR ACC 0x01  : zet bit 0 (reset timer)
    -- 16#02# => "0101000011111101", -- WRITE MEM 0xFD  : schrijf terug naar timer control

    -- Opgave 5: Vloeistofpeil detector met zones (rood/oranje/groen/alarm) --
    -- Valide waarden: 0x00, 0x80, 0xC0, 0xE0, 0xF0, 0xF8, 0xFC, 0xFE, 0xFF
    -- Output: rood=0x20, oranje=0x40, groen=0x80, alarm=0x10
    16#00# => "0110000000000000", -- INPUT ACC          : lees sensoren
    16#01# => "1010000000000000", -- COMP ACC 0x00      : leeg?
    16#02# => "1001000000010100", -- JUMP Z 0x14        : -> rood
    16#03# => "1010000010000000", -- COMP ACC 0x80      : 1 sensor?
    16#04# => "1001000000010100", -- JUMP Z 0x14        : -> rood
    16#05# => "1010000011000000", -- COMP ACC 0xC0      : 2 sensors?
    16#06# => "1001000000010111", -- JUMP Z 0x17        : -> oranje
    16#07# => "1010000011100000", -- COMP ACC 0xE0      : 3 sensors?
    16#08# => "1001000000010111", -- JUMP Z 0x17        : -> oranje
    16#09# => "1010000011110000", -- COMP ACC 0xF0      : 4 sensors (halfvol)?
    16#0A# => "1001000000011010", -- JUMP Z 0x1A        : -> groen
    16#0B# => "1010000011111000", -- COMP ACC 0xF8      : 5 sensors?
    16#0C# => "1001000000010111", -- JUMP Z 0x17        : -> oranje
    16#0D# => "1010000011111100", -- COMP ACC 0xFC      : 6 sensors?
    16#0E# => "1001000000010111", -- JUMP Z 0x17        : -> oranje
    16#0F# => "1010000011111110", -- COMP ACC 0xFE      : 7 sensors?
    16#10# => "1001000000010100", -- JUMP Z 0x14        : -> rood
    16#11# => "1010000011111111", -- COMP ACC 0xFF      : vol?
    16#12# => "1001000000010100", -- JUMP Z 0x14        : -> rood
    16#13# => "1000000000011101", -- JUMP U 0x1D        : ongeldige waarde -> alarm
    -- ROOD zone (te laag of te hoog)
    16#14# => "0000000000100000", -- LOAD ACC 0x20      : rood = 0010 0000
    16#15# => "0111000000000000", -- OUTPUT ACC
    16#16# => "1000000000000000", -- JUMP U 0x00        : terug naar begin
    -- ORANJE zone (bijna leeg of bijna vol)
    16#17# => "0000000001000000", -- LOAD ACC 0x40      : oranje = 0100 0000
    16#18# => "0111000000000000", -- OUTPUT ACC
    16#19# => "1000000000000000", -- JUMP U 0x00        : terug naar begin
    -- GROEN zone (halfvol = optimaal)
    16#1A# => "0000000010000000", -- LOAD ACC 0x80      : groen = 1000 0000
    16#1B# => "0111000000000000", -- OUTPUT ACC
    16#1C# => "1000000000000000", -- JUMP U 0x00        : terug naar begin
    -- ALARM (sensor defect - oneindige loop tot reset)
    16#1D# => "0000000000010000", -- LOAD ACC 0x10      : alarm = 0001 0000
    16#1E# => "0111000000000000", -- OUTPUT ACC
    16#1F# => "1000000000011111", -- JUMP U 0x1F        : blijf hier hangen

    others => "0000000000000000" -- the rest of the memory
    );
end SimpleASM;