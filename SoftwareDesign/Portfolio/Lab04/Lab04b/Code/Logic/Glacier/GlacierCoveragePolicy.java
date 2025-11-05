// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Logic.Glacier;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Logic.CoveragePolicy;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Box;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Entity;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Player;

public final class GlacierCoveragePolicy extends CoveragePolicy {
    @Override
    public boolean countsForCoverage(Entity e) {
        return e != null && (e instanceof Box || e instanceof Player);
    }
}