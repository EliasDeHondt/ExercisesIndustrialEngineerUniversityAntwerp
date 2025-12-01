-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2025

library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity ComponentMain is
    Port (
        Clk100MHz: in std_logic := '0';
        BTNL: in std_logic;
        BTNR: in std_logic;
        BTNC: in std_logic;

        VGA_R: out std_logic_vector (3 downto 0);
        VGA_G: out std_logic_vector (3 downto 0);
        VGA_B: out std_logic_vector (3 downto 0);
        HSync: out std_logic;
        VSync: out std_logic;
        Cathodes: out std_logic_vector(7 downto 0);
        Anodes: out std_logic_vector(7 downto 0);
        Leds: out std_logic_vector(15 downto 0)
    );
end ComponentMain;

architecture RTL of ComponentMain is
    type icon is array (0 to 7) of std_logic_vector(15 downto 0); -- 8 rows of 16 pixels (type definition)
    
    constant UM1 : icon := ( -- UM1 (UFO Mothership 1)
        "0000000011110000",
        "0000001111111100",
        "0000011111111110",
        "0000111001100111",
        "0000011111111110",
        "0000000110111000",
        "0000001101110110",
        "0000000000000000"
    );

    constant OF1 : icon := ( -- OF1 (Octopus Frame 1)
        "0000000000010000",
        "0000000001111100",
        "0000000111111110",
        "0000001101101110",
        "0000001111111111",
        "0000000111101101",
        "0000000011000011",
        "0000000001100000"
    );

    constant OF2 : icon := ( -- OF2 (Octopus Frame 2)
        "0000000000010000",
        "0000000001111100",
        "0000000111111110",
        "0000001101101110",
        "0000001111111111",
        "0000000111101101",
        "0000000011010011",
        "0000000010011000"
    );

    constant CF1 : icon := ( -- CF1 (Crab Frame 1)
        "0000001000001000",
        "0000001000001000",
        "0000001111110000",
        "0000011111111000",
        "0000011011011000",
        "0000011111111000",
        "0000111000011100",
        "0000011100111000"
    );

    constant CF2 : icon := ( -- CF2 (Crab Frame 2)
        "0000001000001000",
        "0000001000001000",
        "0000001111110000",
        "0000011111111000",
        "0000011011011000",
        "0000011111111000",
        "0000111000011100",
        "0000110000001100"
    );

    constant SF1 : icon := ( -- SF1 (Squid Frame 1)
        "0000000000001000",
        "0000000000011100",
        "0000000000111110",
        "0000000001101011",
        "0000000001111111",
        "0000000011100110",
        "0000000001000010",
        "0000000010100100"
    );

    constant SF2 : icon := ( -- SF2 (Squid Frame 2)
        "0000000000001000",
        "0000000000011100",
        "0000000000111110",
        "0000000001101011",
        "0000000001111111",
        "0000000011100110",
        "0000000000101010",
        "0000000001000010"
    );

    constant CANNON : icon := ( -- Cannon (simple rectangle base with point/barrel on top, centered)
        "0000000110000000",
        "0000000110000000",
        "0000000110000000",
        "0000011111100000",
        "0000111111110000",
        "0001111111111000",
        "0011111111111100",
        "0000000000000000"
    );

    constant COLOR_ELIASDH_R: std_logic_vector(7 downto 0) := x"4F";
    constant COLOR_ELIASDH_G: std_logic_vector(7 downto 0) := x"94";
    constant COLOR_ELIASDH_B: std_logic_vector(7 downto 0) := x"F0";

    constant CANNON_WIDTH: integer := 16;           -- Full width of cannon icon
    constant CANNON_HEIGHT: integer := 8;           -- Full height of cannon icon
    constant SCALE: integer := 4;

    signal CannonX: integer := 286;                 -- Centered                       - Correct voor SCALE = 4
    signal CannonY: integer := 450;                 -- Bottom of 480p visible area    - Correct voor SCALE = 4

    signal HCounter: integer range 0 to 799 := 0;   -- Horizontal pixel counter (0-based)
    signal VCounter: integer range 0 to 524 := 0;   -- Vertical line counter (0-based)
    signal Clk25MHz: std_logic := '0';              -- Derived 25 MHz clock for VGA timing
    signal ClkDivider: integer range 0 to 1 := 0;   -- Simplified divider counter for 50% duty

    signal BTNL_sync: std_logic := '0';             -- Synchronized left button
    signal BTNR_sync: std_logic := '0';             -- Synchronized right button
    signal BTNL_prev: std_logic := '0';             -- Previous state of left button
    signal BTNR_prev: std_logic := '0';             -- Previous state of right button

    signal BulletActive: std_logic := '0';          -- Indicates if a bullet is currently active
    signal BulletX: integer range 0 to 639 := 0;
    signal BulletY: integer range 0 to 479 := 479;  -- start buiten scherm
    signal BTNC_sync: std_logic := '0';             -- Synchronized center button
    signal BTNC_prev: std_logic := '0';             -- Previous state of center button
    signal FrameTick: std_logic := '0';             -- 1 puls per frame (60 Hz)
    signal FireEdge : std_logic := '0';             -- Edge detect for firing bullet

    constant BULLET_WIDTH  : integer := 4;
    constant BULLET_HEIGHT : integer := 10;
    constant BULLET_SPEED  : integer := 8;          -- pixels per frame


    signal MainSpeedUp: std_logic; -- Signal from Leds component to indicate when to speed up aliens
    component ComponentLeds -- LED control component
        port (
            Clk100MHz: in std_logic;
            SpeedUp: out std_logic;
            Leds: out std_logic_vector(15 downto 0)
        );
    end component;

    signal MainLives: integer range 0 to 8;        -- Example lives value for 7-seg display
    signal MainScore: integer range 0 to 9999;     -- Example score value for 7-seg display
    component Component7Seg -- 7-segment display component
        port (
            Clk100MHz: in std_logic;
            Cathodes: out std_logic_vector(7 downto 0);
            Anodes: out std_logic_vector(7 downto 0);
            Lives: in integer range 0 to 8;
            Score: in integer range 0 to 9999
        );
    end component;
begin
    CLOCK_DIVIDER: process (Clk100MHz) is begin -- Generate 25 MHz clock from 100 MHz (divide by 4, better duty)
        if rising_edge(Clk100MHz) then
            ClkDivider <= ClkDivider + 1;
            if ClkDivider = 1 then
                ClkDivider <= 0;
                Clk25MHz <= not Clk25MHz;  -- Toggle every 2 cycles for ~50% duty
            end if;
        end if;
    end process CLOCK_DIVIDER;

    VGA_TIMING: process (Clk25MHz) is begin
        if rising_edge(Clk25MHz) then
            FrameTick <= '0';                           -- Clear frame tick each pixel    
            if HCounter = 799 then                      -- End of line
                HCounter <= 0;
                if VCounter = 524 then                  -- End of frame
                    VCounter <= 0;
                    FrameTick <= '1';                   -- Signal new frame
                else
                    VCounter <= VCounter + 1;           -- Next line
                end if;
            else
                HCounter <= HCounter + 1;              -- Next pixel
            end if;
        end if;
    end process VGA_TIMING;

    GAME_LOGIC: process (Clk25MHz) begin
        if rising_edge(Clk25MHz) then
            if BTNC_sync = '1' and BTNC_prev = '0' then
                FireEdge <= '1';
            end if;

            if HCounter = 799 and VCounter = 524 then
                if FireEdge = '1' and BulletActive = '0' then
                    BulletActive <= '1';
                    BulletX <= CannonX + (CANNON_WIDTH * SCALE)/2 - BULLET_WIDTH/2;
                    BulletY <= CannonY - BULLET_HEIGHT - 10;
                end if;
                FireEdge <= '0';  -- Reset na verwerking

                if BulletActive = '1' then
                    if BulletY >= BULLET_SPEED + BULLET_HEIGHT then
                        BulletY <= BulletY - BULLET_SPEED;
                    else
                        BulletActive <= '0';
                    end if;
                end if;
            end if;

            BTNC_prev <= BTNC_sync;
        end if;
    end process GAME_LOGIC;

    CANNON_INPUTS: process(Clk100MHz)
        constant MOVE_STEP : integer := CANNON_WIDTH * SCALE;  -- 16 * SCALE
    begin
        if rising_edge(Clk100MHz) then
            -- Input synchronisatie
            BTNL_prev <= BTNL_sync;
            BTNR_prev <= BTNR_sync;

            BTNL_sync <= BTNL;
            BTNR_sync <= BTNR;
            BTNC_sync <= BTNC;

            if (BTNL_sync = '1' and BTNL_prev = '0') then -- LEFT edge detect
                if CannonX > MOVE_STEP then
                    CannonX <= CannonX - MOVE_STEP;
                else
                    CannonX <= 0;
                end if;
            end if;

            if (BTNR_sync = '1' and BTNR_prev = '0') then -- RIGHT edge detect
                if CannonX < (640 - (CANNON_WIDTH * SCALE) - MOVE_STEP) then
                    CannonX <= CannonX + MOVE_STEP;
                else
                    CannonX <= 640 - (CANNON_WIDTH * SCALE);
                end if;
            end if;
        end if;
    end process CANNON_INPUTS;

    VGA_SYNC: process (HCounter, VCounter) is begin     -- Standard 640x480@60Hz sync pulses
        if VCounter >= 490 and VCounter <= 491 then     -- VSync pulse
            VSync <= '0';
        else
            VSync <= '1';
        end if;
        if HCounter >= 656 and HCounter <= 751 then     -- HSync pulse
            HSync <= '0';
        else
            HSync <= '1';
        end if;

        if HCounter <= 639 and VCounter <= 479 then -- Visible area
            if HCounter = 0 or HCounter = 639 or VCounter = 0 or VCounter = 479 then -- Check for border pixels
                VGA_R <= "1111";
                VGA_G <= "0000";
                VGA_B <= "0000";
            else
                VGA_R <= "1111";
                VGA_G <= "1111";
                VGA_B <= "1111";
            end if;

            if HCounter >= CannonX and HCounter < CannonX + (CANNON_WIDTH * SCALE) 
            and VCounter >= CannonY and VCounter < CannonY + (CANNON_HEIGHT * SCALE) then -- Draw cannon

                if CANNON((VCounter - CannonY) / SCALE)(15 - ((HCounter - CannonX) / SCALE)) = '1' then
                    VGA_R <= COLOR_ELIASDH_R(7 downto 4);
                    VGA_G <= COLOR_ELIASDH_G(7 downto 4);
                    VGA_B <= COLOR_ELIASDH_B(7 downto 4);
                end if;
            end if;

            if BulletActive = '1' then -- Draw bullet
                if HCounter >= BulletX and HCounter < BulletX + BULLET_WIDTH and
                   VCounter >= BulletY and VCounter < BulletY + BULLET_HEIGHT then
                    VGA_R <= "1111";
                    VGA_G <= "0000";
                    VGA_B <= "0000";
                end if;
            end if;
        else
            VGA_R <= "0000";
            VGA_G <= "0000";
            VGA_B <= "0000";
        end if;
    end process VGA_SYNC;

    -- Temp values for testing
    MainLives <= 5;
    MainScore <= 1234;

    COMPONENTLEDS_INST: ComponentLeds port map (Clk100MHz => Clk100MHz, SpeedUp => MainSpeedUp, Leds => Leds); -- LED component instantiation
    COMPONENT7SEG_INST: Component7Seg port map (Clk100MHz => Clk100MHz, Cathodes => Cathodes, Anodes => Anodes, Lives => MainLives, Score => MainScore); -- 7-segment display component instantiation
end RTL;