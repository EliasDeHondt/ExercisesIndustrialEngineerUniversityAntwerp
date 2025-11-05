// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.Glacier;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Config.AppConfig;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.Level;

public final class GlacierLevel extends Level {
    @Override
    public int extraPullBias() {
        return AppConfig.get().GlacierPullBonus;
    }
}