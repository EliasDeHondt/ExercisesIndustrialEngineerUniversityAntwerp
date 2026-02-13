-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2025

-------------------- Main --------------------
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity Main is
    Port (
        Clk: in std_logic;
        Cathodes: out std_logic_vector(7 downto 0);
        Anodes: out std_logic_vector(7 downto 0)
    );
end Main;

architecture RTL of Main is
    signal clk_divider: unsigned(15 downto 0) := (others => '0');
    signal clk_8khz: std_logic := '0';
    signal display_sel: unsigned(2 downto 0) := (others => '0');
    signal segments: std_logic_vector(7 downto 0);
begin
    CLOCK_DIVIDER: process(Clk) begin
        if rising_edge(Clk) then -- Triggers only on rising edge of Clk (100 MHz system clock)
            if clk_divider = 6249 then -- Divide by 6250 to get 8 kHz
                clk_divider <= (others => '0'); -- Reset counter
                clk_8khz <= not clk_8khz;
            else
                clk_divider <= clk_divider + 1;
            end if;
        end if;
    end process CLOCK_DIVIDER;

    DISPLAY_COUNTER: process(clk_8khz) begin
        if rising_edge(clk_8khz) then -- Triggers only on rising edge of Clk (8 kHz clock)
            if display_sel = 7 then
                display_sel <= (others => '0');
            else
                display_sel <= display_sel + 1;
            end if;
        end if;
    end process DISPLAY_COUNTER;

    DISPLAY: process(display_sel) begin
        case display_sel is
            when "000" => 
                segments <= "10011111"; -- 1
                Anodes <= "11111110"; -- Enable display 1
            when "001" => 
                segments <= "00100101"; -- 2 
                Anodes <= "11111101"; -- Enable display 2
            when "010" => 
                segments <= "00001101"; -- 3
                Anodes <= "11111011"; -- Enable display 3
            when "011" => 
                segments <= "10011001"; -- 4
                Anodes <= "11110111"; -- Enable display 4
            when "100" => 
                segments <= "01001001"; -- 5
                Anodes <= "11101111"; -- Enable display 5
            when "101" => 
                segments <= "01000001"; -- 6
                Anodes <= "11011111"; -- Enable display 6
            when "110" => 
                segments <= "00011111"; -- 7
                Anodes <= "10111111"; -- Enable display 7
            when "111" => 
                segments <= "00000001"; -- 8
                Anodes <= "01111111"; -- Enable display 8
            when others => 
                segments <= (others => '1');
                Anodes <= (others => '1');
        end case;
    end process DISPLAY;
    Cathodes <= segments;
end RTL;
-------------------- Main --------------------