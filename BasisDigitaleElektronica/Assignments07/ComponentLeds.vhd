-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2025

library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity ComponentLeds is
    port (
        Clk100MHz: in std_logic := '0';
        SpeedUp: out std_logic;  -- Output to indicate when to increase alien speed
        Leds: out std_logic_vector(15 downto 0)
        );
end ComponentLeds;

architecture RTL of ComponentLeds is
    signal ClkDivider: unsigned(26 downto 0) := (others => '0');   -- Counter for clock division (~2Hz, larger for slower)
    signal Position: integer range 0 to 15 := 15;                  -- Current LED position (start left, LED 15)
    signal Direction: std_logic := '1';                            -- '1' = descending (left to right, 15->0), '0' = ascending
begin
    LEDS_PROCESS: process(Clk100MHz) begin
        if rising_edge(Clk100MHz) then
            if ClkDivider = 49_999_999 then -- Clock divider (2Hz) - (100.000.000 / 50.000.000 = 2Hz)
                ClkDivider <= (others => '0');

                -- Default output
                SpeedUp <= '0';
                Leds    <= (others => '0');
                Leds(Position) <= '1';

                if Direction = '1' then -- Moving (15 to 0) left to right
                    if Position = 0 then
                        Direction <= '0';
                        SpeedUp <= '1';
                    else
                        Position <= Position - 1;
                    end if;
                else -- Moving (0 to 15) right to left
                    if Position = 15 then
                        Direction <= '1';
                        SpeedUp <= '1';
                    else
                        Position <= Position + 1;
                    end if;
                end if;
            else
                ClkDivider <= ClkDivider + 1;
            end if;
        end if;
    end process LEDS_PROCESS;
end RTL;