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
        Leds: out std_logic_vector(15 downto 0)
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
                end if;
            when "01" => -- 1
                Leds <= std_logic_vector(shift_left(to_unsigned(1, 16), to_integer(CountMain))); -- (0000 0000 0000 0001) <- Shift left by CountMain
            when "10" => -- 2
                if CountMain < 8 then -- CountMain <= "0111" (7)
                    Anodes <= std_logic_vector(shift_left(to_unsigned(1, 8), to_integer(CountMain))); -- (0000 0001) <- Shift left by CountMain
                else -- CountMain > "0111" (7)
                    Anodes <= std_logic_vector(shift_right(to_unsigned(128, 8), to_integer(CountMain - 8))); -- (1000 0000) -> Shift right by (CountMain - 8)
                end if;
                Leds <= std_logic_vector(shift_right(to_unsigned(32768, 16), to_integer(CountMain))); -- (1000 0000 0000 0000) -> Shift right by CountMain
            when "11" => -- 4
                case CountMain is
                    when "0000" => -- 0
                        Cathodes <= "1111110"; -- a,b,c,d,f
                    when "0001" => -- 1
                        Cathodes <= "0110000"; --b,c
                    when "0010" => -- 2
                        Cathodes <= "1101101"; -- a,b,d,e,g
                    when "0011" => -- 3
                        Cathodes <= "1111001"; -- a,b,c,d,g
                    when "0100" => -- 4
                        Cathodes <= "0110011"; -- b,c,f,g
                    when "0101" => -- 5
                        Cathodes <= "1011011"; -- a,c,d,f,g
                    when "0110" => -- 6
                        Cathodes <= "1011111"; -- a,c,d,e,f,g
                    when "0111" => -- 7
                        Cathodes <= "1110000"; -- a,b,c
                    when "1000" => -- 8
                        Cathodes <= "1111111"; -- a,b,c,d,e,f,g
                    when "1001" => -- 9
                        Cathodes <= "1111011"; -- a,b,c,d,f,g
                    when others =>
                        Cathodes <= (others => '1'); -- Turn off all segments
                end case;
                Leds <= (others => '1'); -- All on
        end case;
    end process;
end Behavioral;
-------------------- Main --------------------

-------------------- Test --------------------

-------------------- Test --------------------