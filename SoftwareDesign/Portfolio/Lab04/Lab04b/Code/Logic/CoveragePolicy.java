// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Logic;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Entity;

public abstract class CoveragePolicy {
    public abstract boolean countsForCoverage(Entity e);
}