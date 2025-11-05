// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Warehouse;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.Palette;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.GroundTile;
import javafx.scene.canvas.GraphicsContext;

public final class WarehouseWall extends GroundTile {
    @Override
    public boolean isSolid() {
        return true;
    }

    @Override
    public boolean isSlippery() {
        return false;
    }

    @Override
    public boolean isTarget() {
        return false;
    }

    @Override
    public void render(GraphicsContext g, Palette p, int x, int y, int s) {
        g.setFill(p.getWall());
        g.fillRect(x, y, s, s);
    }
}