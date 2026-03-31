-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2026

library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity ALU is
  port (
    A   : in  unsigned (7 downto 0);         -- Input A
    B   : in  unsigned (7 downto 0);         -- Input B
    Sel : in  std_logic_vector (2 downto 0); -- Operation select
    Z   : out unsigned (7 downto 0);         -- Result output
    CF  : out std_logic;                     -- Carry flag
    ZF  : out std_logic);                    -- Zero flag
end ALU;

-- Available operations:
--    Z=A
--    Z=B
--    Z=A+B
--    Z=A-B
--    Z=A&B (bitwise and)
--    Z=A+1 (used for program counter)
--    Z=A|B (bitwise or)

-- Available flags:
--    CF: carry flag (not always overflow!)
--    ZF: zero flag (when result is zero)

architecture RTL of ALU is
  signal Sum : unsigned (8 downto 0);
  signal Result : unsigned (7 downto 0);
begin

  -- Use extra sum bit to calculate carry flag
  Sum <= unsigned('0' & A) + B when Sel = "010" else -- A+B
        unsigned('0' & A) + not B + 1 when Sel = "011" else -- A-B
        unsigned('0' & A) + 1 when Sel = "101" else -- A+1
        (others => '0');

  -- Use internal signal Result, since ZF cannot read from output Z (see below)
  Result <= A when Sel = "000" else
            B when Sel = "001" else
            Sum (7 downto 0) when Sel = "010" else -- A+B
            Sum (7 downto 0) when Sel = "011" else -- A-B
            A and B when Sel = "100" else          -- A&B
            Sum (7 downto 0) when Sel = "101" else -- A+1
            A or B when Sel = "110" else -- A|B
            (others => '0');
  Z  <= Result;

  -- Zero flag
  ZF <= '1' when Result = 0 else '0';

  -- Carry flag. Does NOT always mean overflow!
  CF <= Sum(8);
end RTL;