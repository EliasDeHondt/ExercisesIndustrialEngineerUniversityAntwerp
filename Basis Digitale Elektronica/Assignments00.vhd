-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2025

-------------------- Main --------------------
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;

entity Main is
    Port (
        A, B, C : in STD_LOGIC; 
        G : out STD_LOGIC
        );
end Main;

architecture Behavioral of Main is begin
    G <= (not(A) and (not(B) or C)) or (not((A and not(B)) or not(C))) or (B and C); -- G <= (not(C) or not(A) or B);
end Behavioral;
-------------------- Main --------------------