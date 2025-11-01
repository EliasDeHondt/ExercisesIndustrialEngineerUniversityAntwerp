-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2025

-------------------- Main --------------------
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity Main is
    port (
        Clk: in std_logic;
        VGA_R: out std_logic_vector(3 downto 0);
        VGA_G: out std_logic_vector(3 downto 0);
        VGA_B: out std_logic_vector(3 downto 0);
        VGA_HS: out std_logic;
        VGA_VS: out std_logic
        );
end Main;

architecture Behavioral of Main is
    -- Clock divider signals
    signal clk25 : std_logic := '0';
    signal div_counter : std_logic := '0';


    -- Horizontal and vertical counters
    signal h_count : integer range 0 to 799 := 0; -- 800 pixels per row 
    signal v_count : integer range 0 to 524 := 0; -- 525 pixels per column

    -- Visible area flag
    signal visible_area : std_logic;
begin
    process(Clk) begin
        if rising_edge(Clk) then
            div_counter <= not div_counter;
            if div_counter = '1' then
                clk25 <= not clk25;
            end if;
        end if;
    end process;

    process(clk25) begin
        if rising_edge(clk25) then -- Triggers only on rising edge of Clk (25 MHz pixel clock)
            if h_count = 799 then
                h_count <= 0;
                if v_count = 524 then
                    v_count <= 0;
                else
                    v_count <= v_count + 1;
                end if;
            else
                h_count <= h_count + 1;
            end if;
        end if;
    end process;

    -- Determine if we are in the visible area
    VGA_HS <= '0' when (h_count >= 656 and h_count < 752) else '1'; -- If h_count is between 656 and 752, VGA_HS is low else high
    VGA_VS <= '0' when (v_count >= 490 and v_count < 492) else '1'; -- If v_count is between 490 and 492, VGA_VS is low else high
    visible_area <= '1' when (h_count < 640 and v_count < 480) else '0'; -- Visible area is 640x480

    VGA_R <= "1111" when visible_area = '1' else "0000";
    VGA_G <= "0000";
    VGA_B <= "0000";
end Behavioral;
-------------------- Main --------------------