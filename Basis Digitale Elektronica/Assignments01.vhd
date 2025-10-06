-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2025

-------------------- Main --------------------

-------------------- Main --------------------

----------------- CountSnake -----------------
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;
entity CountSnake is
    port (
        Count: in unsigned(2 downto 0); -- 3-bit input
        SevenSegm: out std_logic_vector(6 downto 0) -- 7-bit output for 7-segment display
        );
end CountSnake;
----------------- CountSnake -----------------

-------------------- Test --------------------

-------------------- Test --------------------