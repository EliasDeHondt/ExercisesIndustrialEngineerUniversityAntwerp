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
        VSync: out std_logic
    );
end Main;

architecture Behavioral of Main is
    constant COLOR_ELIASDH_R: std_logic_vector(7 downto 0)  := x"4F";
    constant COLOR_ELIASDH_G: std_logic_vector(7 downto 0)  := x"94";
    constant COLOR_ELIASDH_B: std_logic_vector(7 downto 0)  := x"F0";

    signal HCounter : integer := 1;                 -- Horizontal pixel counter
    signal VCounter : integer := 1;                 -- Vertical line counter
    signal Clk25MHz : std_logic := '0';             -- Derived 25 MHz clock for VGA timing
    signal Counter  : integer := 0;                 -- Clock divider counter
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

    VGA_SYNC: process (HCounter, VCounter) is begin
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
        if HCounter <= 688 and HCounter > 48 and VCounter <= 513 and VCounter > 33 then -- Visible area
            VGA_R <= COLOR_ELIASDH_R(7 downto 4); -- Red component
            VGA_G <= COLOR_ELIASDH_G(7 downto 4); -- Green
            VGA_B <= COLOR_ELIASDH_B(7 downto 4); -- Blue
        else
            VGA_R <= "0000"; -- No Red
            VGA_G <= "0000"; -- No Green
            VGA_B <= "0000"; -- No Blue
        end if;
    end process VGA_SYNC;

end Behavioral;
-------------------- Main --------------------