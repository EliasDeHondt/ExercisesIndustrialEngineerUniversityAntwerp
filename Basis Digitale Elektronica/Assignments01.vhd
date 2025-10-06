-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2025

-------------------- Main --------------------
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity Assignments01 is
    port (
        Count: in unsigned(2 downto 0); -- 3-bit input
        SevenSegm: out std_logic_vector(6 downto 0) -- 7-bit output for 7-segment display
        );
end Assignments01;

architecture Behavioral of Assignments01 is

begin
    process(Count) begin
        case Count is
            when "000" => -- 0
                SevenSegm <= "0011111"; -- a,b
            when "001" => -- 1
                SevenSegm <= "1011110"; -- b,g
            when "010" => -- 2
                SevenSegm <= "1111010"; -- g,e
            when "011" => -- 3
                SevenSegm <= "1110011"; -- e,d
            when "100" => -- 4
                SevenSegm <= "1100111"; -- d,c
            when "101" => -- 5
                SevenSegm <= "1101110"; -- c,g
            when "110" => -- 6
                SevenSegm <= "1001110"; -- g,f
            when "111" => -- 7
                SevenSegm <= "1001111"; -- f,a
            when others =>
                SevenSegm <= (others => '1'); -- Turn off all segments
        end case;
    end process;
end Behavioral;
-------------------- Main --------------------

-------------------- Test --------------------

-------------------- Test --------------------