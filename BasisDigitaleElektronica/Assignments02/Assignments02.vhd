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
    signal Cathodes_snake: std_logic_vector(6 downto 0); -- output from Snake submodule
    signal Cathodes_int: std_logic_vector(6 downto 0); -- Internal signal
    signal Anodes_int: std_logic_vector(7 downto 0); -- Internal signal
    signal Leds_int: std_logic_vector(15 downto 0); -- Internal signal
begin
    Snake: entity work.Snake(Behavioral) port map ( -- Component Instance
            CountSnake => CountMain(2 downto 0), -- Input Main = Input Snake (3 LSB of CountMain)
            SevenSegm => Cathodes_snake -- Output Snake = Output Main (Cathodes)
        );
    MODE_SELECT: process(Mode, CountMain, Cathodes_snake) begin -- Sensitivity list
        case Mode is
            when "00" => -- 0
                if CountMain(3) = '1' then -- CountMain >= "1000" (8)
                    Anodes_int <= "00001111";
                    Cathodes_int <= Cathodes_snake;
                else -- CountMain < "1000" (8)
                    Anodes_int <= "00000000";
                    Cathodes_int <= Cathodes_snake;
                end if;
                Leds_int <= (others => '0');
            when "01" => -- 1
                Anodes_int <= (others => '1');
                Cathodes_int <= (others => '1');
                Leds_int <= std_logic_vector(shift_left(to_unsigned(1, 16), to_integer(CountMain))); -- (0000 0000 0000 0001) <- Shift left by CountMain
            when "10" => -- 2
                case CountMain is
                    when "0000" =>
                        Anodes_int <= "01111111";
                    when "0001" =>
                        Anodes_int <= "10111111";
                    when "0010" =>
                        Anodes_int <= "11011111";
                    when "0011" =>
                        Anodes_int <= "11101111";
                    when "0100" =>
                        Anodes_int <= "11110111";
                    when "0101" =>
                        Anodes_int <= "11111011";
                    when "0110" =>
                        Anodes_int <= "11111101";
                    when "0111" =>
                        Anodes_int <= "11111110";
                    when "1000" =>
                        Anodes_int <= "11111110";
                    when "1001" =>
                        Anodes_int <= "11111101";
                    when "1010" =>
                        Anodes_int <= "11111011";
                    when "1011" =>
                        Anodes_int <= "11110111";
                    when "1100" =>
                        Anodes_int <= "11101111";
                    when "1101" =>
                        Anodes_int <= "11011111";
                    when "1110" =>
                        Anodes_int <= "10111111";
                    when "1111" =>
                        Anodes_int <= "01111111";
                end case;
                Cathodes_int <= Cathodes_snake;
                Leds_int <= std_logic_vector(shift_right(to_unsigned(32768, 16), to_integer(CountMain))); -- (1000 0000 0000 0000) -> Shift right by CountMain
            when "11" => -- 4
                if CountMain > 9 then
                    Cathodes_int <= (others => '1');
                    Anodes_int <= (others => '1');
                else
                    case CountMain is
                        when "0000" => -- 0
                            Cathodes_int <= "0000001"; -- a,b,c,d,f
                        when "0001" => -- 1
                            Cathodes_int <= "1001111"; --b,c
                        when "0010" => -- 2
                            Cathodes_int <= "0010010"; -- a,b,d,e,g
                        when "0011" => -- 3
                            Cathodes_int <= "0000110"; -- a,b,c,d,g
                        when "0100" => -- 4
                            Cathodes_int <= "1001100"; -- b,c,f,g
                        when "0101" => -- 5
                            Cathodes_int <= "0100100"; -- a,c,d,f,g
                        when "0110" => -- 6
                            Cathodes_int <= "0100000"; -- a,c,d,e,f,g
                        when "0111" => -- 7
                            Cathodes_int <= "0001111"; -- a,b,c
                        when "1000" => -- 8
                            Cathodes_int <= "0000000"; -- a,b,c,d,e,f,g
                        when "1001" => -- 9
                            Cathodes_int <= "0000100"; -- a,b,c,d,f,g
                        when others =>
                            Cathodes_int <= (others => '1'); -- Turn off all segments
                    end case;
                    Anodes_int <= (others => '0');
                end if;
                Leds_int <= (others => '1'); -- All on
            when others =>
            Cathodes_int <= (others => '1'); -- Default off (SevenSegm)
            Anodes_int <= (others => '1'); -- Default off (Display)
            Leds_int <= (others => '0'); -- Default off (LEDs)
        end case;
    end process MODE_SELECT;
    Cathodes <= Cathodes_int; -- Output assignment
    Anodes <= Anodes_int; -- Output assignment
    Leds <= Leds_int; -- Output assignment
end Behavioral;
-------------------- Main --------------------

-------------------- Snake -------------------
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity Snake is
    port (
        CountSnake: in unsigned(2 downto 0); -- 3-bit input
        SevenSegm: out std_logic_vector(6 downto 0) -- 7-bit output for 7-segment display
        );
end Snake;

architecture Behavioral of Snake is
begin
    SET_SNEGM: process(CountSnake) begin
        case CountSnake is
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
                SevenSegm <= "1111100"; -- g,f
            when "111" => -- 7
                SevenSegm <= "0111101"; -- f,a
            when others =>
                SevenSegm <= (others => '1'); -- Turn off all segments
        end case;
    end process SET_SNEGM;
end Behavioral;
-------------------- Snake -------------------

-------------------- Test --------------------
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity TestMain is
end TestMain;

architecture Behavioral of TestMain is
    signal CountMain: unsigned(3 downto 0) := (others => '0');
    signal Mode: std_logic_vector(1 downto 0) := "00";
    signal Cathodes: std_logic_vector(6 downto 0);
    signal Anodes: std_logic_vector(7 downto 0);
    signal Leds: std_logic_vector(15 downto 0);

    component Main is
        port (
            CountMain: in unsigned(3 downto 0);
            Mode: in std_logic_vector(1 downto 0);
            Cathodes: out std_logic_vector(6 downto 0);
            Anodes: out std_logic_vector(7 downto 0);
            Leds: out std_logic_vector(15 downto 0)
        );
    end component;
begin
    Testing: Main port map(CountMain => CountMain, Mode => Mode, Cathodes => Cathodes, Anodes => Anodes, Leds => Leds);

    P_STIMULI: process begin
        wait for 100 ns;
        for m in 0 to 3 loop
            Mode <= std_logic_vector(to_unsigned(m, 2));
            wait for 100 ns; -- wacht zodat Main de nieuwe Mode ziet
            for c in 0 to 15 loop
                CountMain <= to_unsigned(c, 4);
                wait for 100 ns; -- wacht zodat Main de nieuwe CountMain ziet
            end loop;
        end loop;
    end process P_STIMULI;
end Behavioral;
-------------------- Test --------------------