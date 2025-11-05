// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Empty;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Entity;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.GroundTile;

public final class Cell {
    public GroundTile ground;
    public Entity thing;

    public Cell(GroundTile g, Entity t) {
        this.ground = g;
        this.thing = (t == null ? Empty.instance() : t);
    }

    public boolean isWalkable() {
        return !ground.isSolid();
    }

    public boolean isTarget() {
        return ground.isTarget();
    }

    public boolean isEmpty() {
        return thing == null || thing.isEmpty();
    }
}