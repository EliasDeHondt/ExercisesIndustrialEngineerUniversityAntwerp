library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity ComponentLeds is
    port (
        Clk100MHz: in std_logic := '0';
        SpeedUp: out std_logic;  -- Renamed output to indicate when to increase alien speed
        Leds: out std_logic_vector(15 downto 0)
        );
end ComponentLeds;

architecture RTL of ComponentLeds is
    signal ClkDivider: unsigned(26 downto 0) := (others => '0');   -- Counter voor clock division (~2Hz, groter voor langzamer)
    signal Position: integer range 0 to 15 := 15;                  -- Huidige LED positie (start links, LED 15)
    signal DirectionDown: std_logic := '1';                        -- '1' = dalend (links naar rechts, 15->0), '0' = stijgend
begin
    LEDS_PROCESS: process(Clk100MHz) begin
        if rising_edge(Clk100MHz) then
            if ClkDivider = 49_999_999 then -- Clock divider (2Hz)
                ClkDivider <= (others => '0');

                -- Default output
                SpeedUp <= '0';
                Leds    <= (others => '0');
                Leds(Position) <= '1';

                if DirectionDown = '1' then -- Bounce Beweging
                    if Position = 0 then
                        DirectionDown <= '0';
                        SpeedUp <= '1';
                    else
                        Position <= Position - 1;
                    end if;
                else
                    if Position = 15 then
                        DirectionDown <= '1';
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