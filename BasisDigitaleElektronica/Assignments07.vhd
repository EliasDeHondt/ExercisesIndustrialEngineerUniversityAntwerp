-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2025

-------------------- Main --------------------
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity Main is
    Port (
        Clk100MHz: in std_logic := '0';
        VGA_R: out std_logic_vector (3 downto 0);
        VGA_G: out std_logic_vector (3 downto 0);
        VGA_B: out std_logic_vector (3 downto 0);
        HSync: out std_logic;
        VSync: out std_logic;
        Cathodes: out std_logic_vector(7 downto 0);
        Anodes: out std_logic_vector(7 downto 0);
        Leds: out std_logic_vector(15 downto 0)
    );
end Main;

architecture Behavioral of Main is
    type icon is array (0 to 7) of std_logic_vector(15 downto 0); -- 8 rows of 16 pixels (type definition)
    
    constant UM1 : icon := ( -- UM1 (UFO Mothership 1)
        x"00F0",  -- 0000000011110000
        x"03FC",  -- 0000001111111100
        x"07FE",  -- 0000011111111110
        x"0E67",  -- 0000111001100111
        x"07FE",  -- 0000011111111110
        x"01B8",  -- 0000000110111000
        x"0376",  -- 0000001101110110
        x"0000"   -- 0000000000000000
    );

    constant OF1 : icon := ( -- OF1 (Octopus Frame 1)
        x"0010",  -- 0000000000010000
        x"007C",  -- 0000000001111100
        x"01FE",  -- 0000000111111110
        x"036E",  -- 0000001101101110
        x"03FF",  -- 0000001111111111
        x"01ED",  -- 0000000111101101
        x"00C3",  -- 0000000011000011
        x"0060"   -- 0000000001100000
    );

    constant OF2 : icon := ( -- OF2 (Octopus Frame 2)
        x"0010",  -- 0000000000010000
        x"007C",  -- 0000000001111100
        x"01FE",  -- 0000000111111110
        x"036E",  -- 0000001101101110
        x"03FF",  -- 0000001111111111
        x"01ED",  -- 0000000111101101
        x"00D3",  -- 0000000011010011
        x"0098"   -- 0000000010011000
    );

    constant CF1 : icon := ( -- CF1 (Crab Frame 1)
        x"0208",  -- 0000001000001000
        x"0208",  -- 0000001000001000
        x"03F0",  -- 0000001111110000
        x"07F8",  -- 0000011111111000
        x"06D8",  -- 0000011011011000
        x"07F8",  -- 0000011111111000
        x"0E1C",  -- 0000111000011100
        x"0738"   -- 0000011100111000
    );

    constant CF2 : icon := ( -- CF2 (Crab Frame 2)
        x"0208",  -- 0000001000001000
        x"0208",  -- 0000001000001000
        x"03F0",  -- 0000001111110000
        x"07F8",  -- 0000011111111000
        x"06D8",  -- 0000011011011000
        x"07F8",  -- 0000011111111000
        x"0E1C",  -- 0000111000011100
        x"0C0C"   -- 0000110000001100
    );

    constant SF1 : icon := ( -- SF1 (Squid Frame 1)
        x"0008",  -- 0000000000001000
        x"001C",  -- 0000000000011100
        x"003E",  -- 0000000000111110
        x"006B",  -- 0000000001101011
        x"007F",  -- 0000000001111111
        x"00E6",  -- 0000000011100110
        x"0042",  -- 0000000001000010
        x"00A4"   -- 0000000010100100
    );

    constant SF2 : icon := ( -- SF2 (Squid Frame 2)
        x"0008",  -- 0000000000001000
        x"001C",  -- 0000000000011100
        x"003E",  -- 0000000000111110
        x"006B",  -- 0000000001101011
        x"007F",  -- 0000000001111111
        x"00E6",  -- 0000000011100110
        x"002A",  -- 0000000000101010
        x"0042"   -- 0000000001000010
    );

    constant CANNON : icon := ( -- Cannon (simple rectangle base with point/barrel on top, centered)
        x"0180",  -- 0000000110000000
        x"0180",  -- 0000000110000000
        x"0180",  -- 0000000110000000
        x"07E0",  -- 0000011111100000
        x"0FF0",  -- 0000111111110000
        x"1FF8",  -- 0001111111111000
        x"3FFC",  -- 0011111111111100
        x"0000"   -- 0000000000000000
    );



    constant COLOR_ELIASDH_R: std_logic_vector(7 downto 0) := x"4F";
    constant COLOR_ELIASDH_G: std_logic_vector(7 downto 0) := x"94";
    constant COLOR_ELIASDH_B: std_logic_vector(7 downto 0) := x"F0";

    signal HCounter: integer := 1;                 -- Horizontal pixel counter
    signal VCounter: integer := 1;                 -- Vertical line counter
    signal Clk25MHz: std_logic := '0';             -- Derived 25 MHz clock for VGA timing
    signal Counter: integer := 0;                  -- Clock divider counter
begin
    CLOCK_DIVIDER: process (Clk100MHz) is begin -- Generate 25 MHz clock from 100 MHz input 1/4 frequency
        if rising_edge(Clk100MHz) then
            if Counter < 1 then
                Clk25MHz <= '0';
                Counter <= Counter + 1;
            elsif Counter <= 2 then
                Clk25MHz <= '1';
                Counter <= Counter + 1;
            else
                Clk25MHz <= '0';
                Counter <= 0;
            end if;
        end if;
    end process CLOCK_DIVIDER;

    VGA_TIMING: process (Clk25MHz) is begin
        if rising_edge(Clk25MHz) then
            if HCounter = 800 then                      -- End of line
                HCounter <= 1;
                if VCounter = 525 then                  -- End of frame
                    VCounter <= 1;
                else 
                    VCounter <= VCounter + 1;           -- Next line
                end if;
            else HCounter <= HCounter + 1;              -- Next pixel
            end if;
        end if;
    end process VGA_TIMING;

    VGA_SYNC: process (HCounter, VCounter) is begin     -- Standard 640x480@60Hz sync pulses
        if VCounter > 523 and VCounter <= 525 then      -- VSync pulse
            VSync <= '0';
        else
            VSync <= '1';
        end if;
        if HCounter > 704 and HCounter <= 800 then      -- HSync pulse
            HSync <= '0';
        else
            HSync <= '1';
        end if;
        if HCounter < 640 and VCounter < 480 then -- Visible area
            if HCounter = 0 or HCounter = 639 or VCounter = 0 or VCounter = 479 then -- Check for border pixels
                VGA_R <= "1111";
                VGA_G <= "0000";
                VGA_B <= "0000";
            else
                VGA_R <= COLOR_ELIASDH_R(7 downto 4);
                VGA_G <= COLOR_ELIASDH_G(7 downto 4);
                VGA_B <= COLOR_ELIASDH_B(7 downto 4);
            end if;
        end if;
    end process VGA_SYNC;

    -- Temporary outputs
    Cathodes <= (others => '1');
    Anodes <= (others => '1');
    Leds <= (others => '0');
end Behavioral;
-------------------- Main --------------------