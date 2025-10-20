-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2025

-------------------- Main --------------------
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity Main is
    Port (
        Clk: in std_logic_vector(0 downto 0);
        Cathodes: out std_logic_vector(6 downto 0);
        Anodes: out std_logic_vector(7 downto 0)
    );
end Main;

architecture Behavioral of Main is

begin

end Behavioral;
-------------------- Main --------------------