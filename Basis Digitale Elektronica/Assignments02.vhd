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
    Snake : entity work.Snake(Behavioral) port map ( -- Component Instance
            CountSnake => CountMain(2 downto 0), -- Input Main = Input Snake (3 LSB of CountMain)
            SevenSegm => Cathodes -- Output Snake = Output Main (Cathodes)
        );
    process(Mode, CountMain, Cathodes, Anodes, Leds) begin -- Sensitivity list
        --CountSnake <= CountMain(2 downto 0); -- Take the 3 LSB of CountMain for CountSnake
        Cathodes <= (others => '1'); -- Default off (SevenSegm)
        Anodes <= (others => '1'); -- Default off (Display)
        Leds <= (others => '0'); -- Default off (LEDs)

        case Mode is
            when "00" => -- 0
                if CountMain(3) = '1' then -- CountMain > "0111" (7)
                    Anodes <= "00001111";
                else -- CountMain =< "0111" (7)
                    Anodes <= "00000000";
            when "01" => -- 1
                if CountMain = "0000" then -- 0
                    Leds <= (others => '0');
                else
                    Leds <= std_logic_vector(shift_left(to_unsigned(1, 16), to_integer(CountMain))); -- (0000 0000 0000 0001) <- Shift left by CountMain
                end if
            when "10" => -- 2

            when "11" => -- 4
        end case;
    end process;
end Behavioral;
-------------------- Main --------------------

-------------------- Test --------------------

-------------------- Test --------------------