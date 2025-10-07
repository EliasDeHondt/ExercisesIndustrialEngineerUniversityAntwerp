-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2025

-------------------- Main --------------------
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity Main is
    port (
        Count: in unsigned(3 downto 0);
        Mode: in unsigned(1 downto 0);
        Cathodes: out unsigned(6 downto 0);
        Anodes: out unsigned(7 downto 0);
        Leds: out unsigned(15 downto 0);
        );
end Main;

architecture Behavioral of Main is begin
    


end Behavioral;
-------------------- Main --------------------

-------------------- Test --------------------

-------------------- Test --------------------