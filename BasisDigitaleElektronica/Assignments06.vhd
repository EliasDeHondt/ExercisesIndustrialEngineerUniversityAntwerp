-- @author EliasDH Team
-- @see https://eliasdh.com
-- @since 01/01/2025

-------------------- Main --------------------
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity Main is
    port (
        Dip: in std_logic_vector(1 downto 0);
        R: out std_logic_vector(1 downto 0);
        G: out std_logic_vector(1 downto 0);
        B: out std_logic_vector(1 downto 0);
        HSync: out std_logic_vector(1 downto 0);
        VSync: out std_logic_vector(1 downto 0)
        );
end Main;

architecture Behavioral of Main is

begin

end Behavioral;
-------------------- Main --------------------