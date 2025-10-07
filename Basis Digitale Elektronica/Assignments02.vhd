-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2025

-------------------- Main --------------------
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity Main is
    port (
        CountMain: in unsigned(3 downto 0);
        Mode: in std_logic_vector(1 downto 0);
        Cathodes: out std_logic_vector(6 downto 0);
        Anodes: out std_logic_vector(7 downto 0);
        Leds: out std_logic_vector(15 downto 0);
        );
end Main;

architecture Behavioral of Main is
    signal CountSnake: unsigned(2 downto 0) := (others => '0'); -- Input for Snake
begin
    Snake : entity work.Snake(Behavioral) port map (
            CountMain => CountSnake, -- Input Main = Input Snake
            SevenSegm => Cathodes -- Output Snake = Output Main
        );
    process(Mode, CountMain) begin
        case Mode is
            when "00" => -- 0
            -- if Count > "0111" (7) then
            CountMain(3) = '1' then

            when "01" => -- 1

            when "10" => -- 2

            when "11" => -- 4
        end cases;
    end process;
end Behavioral;
-------------------- Main --------------------

-------------------- Test --------------------

-------------------- Test --------------------