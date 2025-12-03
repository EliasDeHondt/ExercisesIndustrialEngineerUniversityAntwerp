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

    constant OF1 : icon := ( -- OF1 (Octopus Frame 1) Tentacles down
        "0000011111100000",
        "0001111111111000",
        "0011111111111100",
        "0011100110011100",
        "0011111111111100",
        "0000110110110000",
        "0001101001011000",
        "0011000000001100"
    );

    constant OF2 : icon := ( -- OF2 (Octopus Frame 2) Tentacles up
        "0000011111100000",
        "0001111111111000",
        "0011111111111100",
        "0011100110011100",
        "0011111111111100",
        "0000110110110000",
        "0001100110011000",
        "0110000000000110"
    );

    constant CANNON : icon := ( -- Cannon Player ship with detailed design
        "0000000110000000",
        "0000001111000000",
        "0000001111000000",
        "0001111111111000",
        "0011111111111100",
        "0111111111111110",
        "1111111111111111",
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
    signal FireEdge: std_logic := '0';              -- Edge detect for firing bullet

    constant BULLET_WIDTH: integer := 4;
    constant BULLET_HEIGHT: integer := 10;
    constant BULLET_SPEED: integer := 8;            -- pixels per frame

    -- Alien constanten and signalen
    constant ALIEN_WIDTH: integer := 16;            -- Breedte van de alien icon (16 pixels)
    constant ALIEN_HEIGHT: integer := 8;            -- Hoogte van de alien icon (8 pixels)
    constant ALIEN_SCALE: integer := 3;             -- Schaal factor voor alien
    constant ALIEN_DROP: integer := ALIEN_HEIGHT * ALIEN_SCALE; -- Hoeveel pixels naar beneden (eigen hoogte)

    signal AlienX: integer range 0 to 639 := 300;   -- Alien X positie (start in midden)
    signal AlienY: integer range 0 to 479 := 20;    -- Alien Y positie (start bovenaan)
    signal AlienDirRight: std_logic := '1';         -- '1' = beweegt naar rechts, '0' = naar links
    signal AlienActive: std_logic := '1';           -- '1' = alien is actief/zichtbaar
    signal AlienSpeed: integer range 1 to 20 := 1;  -- Huidige alien snelheid (start langzaam, verhoogt over tijd)
    signal AlienFrame: std_logic := '0';            -- '0' = OF1, '1' = OF2 (animatie frame)
    signal AlienFrameCounter: integer range 0 to 29 := 0; -- Teller voor frame wisseling (elke 30 frames)

    signal MainSpeedUp: std_logic;                  -- Signal from Leds component to indicate when to speed up aliens
    signal MainSpeedUp_prev: std_logic := '0';      -- Vorige staat voor edge detection
    component ComponentLeds -- LED control component
        port (
            Clk100MHz: in std_logic;
            SpeedUp: out std_logic;
            Leds: out std_logic_vector(15 downto 0)
        );
    end component;

    signal MainLives: integer range 0 to 8 := 3;    -- Lives value for 7-seg display (start met 3 levens)
    signal MainScore: integer range 0 to 9999 := 0; -- Score value for 7-seg display (start op 0)
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
                Clk25MHz <= not Clk25MHz;               -- Toggle every 2 cycles for ~50% duty
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
                HCounter <= HCounter + 1;               -- Next pixel
            end if;
        end if;
    end process VGA_TIMING;

    GAME_LOGIC: process (Clk25MHz) begin
        if rising_edge(Clk25MHz) then
            if BTNC_sync = '1' and BTNC_prev = '0' then
                FireEdge <= '1';
            end if;

            MainSpeedUp_prev <= MainSpeedUp;
            if MainSpeedUp = '1' and MainSpeedUp_prev = '0' then
                if AlienSpeed < 20 then
                    AlienSpeed <= AlienSpeed + 1;
                end if;
            end if;

            if HCounter = 799 and VCounter = 524 then
                if FireEdge = '1' and BulletActive = '0' then
                    BulletActive <= '1';
                    BulletX <= CannonX + (CANNON_WIDTH * SCALE)/2 - BULLET_WIDTH/2;
                    BulletY <= CannonY - BULLET_HEIGHT - 10;
                end if;
                FireEdge <= '0';  -- Reset na verwerking

                if BulletActive = '1' then -- Update bullet position
                    if BulletY >= BULLET_SPEED + BULLET_HEIGHT then
                        BulletY <= BulletY - BULLET_SPEED; -- Move bullet up
                    else
                        BulletActive <= '0'; -- Bullet goes off screen
                    end if;
                end if;

                -- Alien animatie frame wisselen
                if AlienFrameCounter >= 29 then
                    AlienFrameCounter <= 0;
                    AlienFrame <= not AlienFrame;
                else
                    AlienFrameCounter <= AlienFrameCounter + 1;
                end if;

                if AlienActive = '1' then
                    if AlienDirRight = '1' then
                        if AlienX + (ALIEN_WIDTH * ALIEN_SCALE) + AlienSpeed >= 639 then
                            AlienX <= 639 - (ALIEN_WIDTH * ALIEN_SCALE);
                            AlienY <= AlienY + ALIEN_DROP;
                            AlienDirRight <= '0';
                        else
                            AlienX <= AlienX + AlienSpeed;
                        end if;
                    else
                        if AlienX <= AlienSpeed then
                            AlienX <= 1;
                            AlienY <= AlienY + ALIEN_DROP;
                            AlienDirRight <= '1';
                        else
                            AlienX <= AlienX - AlienSpeed;
                        end if;
                    end if;

                    if AlienY + (ALIEN_HEIGHT * ALIEN_SCALE) >= 479 then
                        AlienX <= 300;
                        AlienY <= 20;
                        AlienDirRight <= '1';
                        if MainLives > 0 then
                            MainLives <= MainLives - 1;
                        end if;
                    end if;

                    if BulletActive = '1' then -- Check for collision with alien
                        if BulletX + BULLET_WIDTH > AlienX and BulletX < AlienX + (ALIEN_WIDTH * ALIEN_SCALE) 
                        and BulletY < AlienY + (ALIEN_HEIGHT * ALIEN_SCALE) and BulletY + BULLET_HEIGHT > AlienY then
                            AlienX <= 300;
                            AlienY <= 20;
                            AlienDirRight <= '1';
                            BulletActive <= '0';
                            MainScore <= MainScore + 100;
                        end if;
                    end if;
                end if;
            end if;

            BTNC_prev <= BTNC_sync;
        end if;
    end process GAME_LOGIC;

    CANNON_INPUTS: process(Clk100MHz)
        constant MOVE_STEP : integer := CANNON_WIDTH * SCALE; -- 16 * SCALE
    begin
        if rising_edge(Clk100MHz) then
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
            if MainLives = 0 or MainScore >= 9999 then -- GAME OVER scherm
                VGA_R <= COLOR_ELIASDH_R(7 downto 4);
                VGA_G <= COLOR_ELIASDH_G(7 downto 4);
                VGA_B <= COLOR_ELIASDH_B(7 downto 4);
            elsif HCounter = 0 or HCounter = 639 or VCounter = 0 or VCounter = 479 then -- Check for border pixels
                VGA_R <= "1111";
                VGA_G <= "0000";
                VGA_B <= "0000";
            else
                VGA_R <= "1111";
                VGA_G <= "1111";
                VGA_B <= "1111";

                if HCounter >= CannonX and HCounter < CannonX + (CANNON_WIDTH * SCALE) 
                and VCounter >= CannonY and VCounter < CannonY + (CANNON_HEIGHT * SCALE) then -- Draw cannon
                    if CANNON((VCounter - CannonY) / SCALE)(15 - ((HCounter - CannonX) / SCALE)) = '1' then
                        VGA_R <= COLOR_ELIASDH_R(7 downto 4);
                        VGA_G <= COLOR_ELIASDH_G(7 downto 4);
                        VGA_B <= COLOR_ELIASDH_B(7 downto 4);
                    end if;
                end if;

                if BulletActive = '1' then -- Draw bullet
                    if HCounter >= BulletX and HCounter < BulletX + BULLET_WIDTH
                    and VCounter >= BulletY and VCounter < BulletY + BULLET_HEIGHT then
                        VGA_R <= "1111";
                        VGA_G <= "0000";
                        VGA_B <= "0000";
                    end if;
                end if;

                if AlienActive = '1' then -- Draw alien OF1/OF2 animatie
                    if HCounter >= AlienX and HCounter < AlienX + (ALIEN_WIDTH * ALIEN_SCALE) 
                    and VCounter >= AlienY and VCounter < AlienY + (ALIEN_HEIGHT * ALIEN_SCALE) then
                        if AlienFrame = '0' then
                            if OF1((VCounter - AlienY) / ALIEN_SCALE)(15 - ((HCounter - AlienX) / ALIEN_SCALE)) = '1' then
                                VGA_R <= "0000";
                                VGA_G <= "1111";
                                VGA_B <= "0000";
                            end if;
                        else
                            if OF2((VCounter - AlienY) / ALIEN_SCALE)(15 - ((HCounter - AlienX) / ALIEN_SCALE)) = '1' then
                                VGA_R <= "0000";
                                VGA_G <= "1111";
                                VGA_B <= "0000";
                            end if;
                        end if;
                    end if;
                end if;
            end if;
        else
            VGA_R <= "0000";
            VGA_G <= "0000";
            VGA_B <= "0000";
        end if;
    end process VGA_SYNC;

    COMPONENTLEDS_INST: ComponentLeds port map (Clk100MHz => Clk100MHz, SpeedUp => MainSpeedUp, Leds => Leds); -- LED component instantiation
    COMPONENT7SEG_INST: Component7Seg port map (Clk100MHz => Clk100MHz, Cathodes => Cathodes, Anodes => Anodes, Lives => MainLives, Score => MainScore); -- 7-segment display component instantiation
end RTL;