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

architecture Behavioral of Main is
    signal clk_divider : unsigned(15 downto 0) := (others => '0');
    signal clk_8khz    : std_logic := '0';
    signal display_sel : unsigned(2 downto 0) := (others => '0');
    signal segments    : std_logic_vector(7 downto 0);
begin
    process(Clk) begin
        if rising_edge(Clk) then
            if clk_divider = 6249 then
                clk_divider <= (others => '0');
                clk_8khz <= not clk_8khz;
            else
                clk_divider <= clk_divider + 1;
            end if;
        end if;
    end process;

    process(clk_8khz) begin
        if rising_edge(clk_8khz) then
            if display_sel = 7 then
                display_sel <= (others => '0');
            else
                display_sel <= display_sel + 1;
            end if;
        end if;
    end process;

    process(display_sel) begin
        case display_sel is
            when "000" => segments <= "11111001"; -- 1
            when "001" => segments <= "10100100"; -- 2
            when "010" => segments <= "10110000"; -- 3
            when "011" => segments <= "10011001"; -- 4
            when "100" => segments <= "10010010"; -- 5
            when "101" => segments <= "10000010"; -- 6
            when "110" => segments <= "11111000"; -- 7
            when "111" => segments <= "10000000"; -- 8
            when others => segments <= (others => '1');
        end case;
    end process;

    process(display_sel) begin
        case display_sel is
            when "000" => Anodes <= "11111110"; -- Enable display 1
            when "001" => Anodes <= "11111101"; -- Enable display 2
            when "010" => Anodes <= "11111011"; -- Enable display 3
            when "011" => Anodes <= "11110111"; -- Enable display 4
            when "100" => Anodes <= "11101111"; -- Enable display 5
            when "101" => Anodes <= "11011111"; -- Enable display 6
            when "110" => Anodes <= "10111111"; -- Enable display 7
            when "111" => Anodes <= "01111111"; -- Enable display 8
            when others => Anodes <= (others => '1');
        end case;
    end process;
    Cathodes <= segments;
end Behavioral;
-------------------- Main --------------------