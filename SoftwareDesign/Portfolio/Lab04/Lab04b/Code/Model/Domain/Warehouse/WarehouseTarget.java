// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Warehouse;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.Palette;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.GroundTile;
import javafx.scene.canvas.GraphicsContext;

public final class WarehouseTarget extends GroundTile {
    @Override
    public boolean isSolid() {
        return false;
    }

    @Override
    public boolean isSlippery() {
        return false;
    }

    @Override
    public boolean isTarget() {
        return true;
    }

    @Override
    public void render(GraphicsContext g, Palette p, int x, int y, int s) {
        g.setFill(p.getFloor());
        g.fillRect(x, y, s, s);
        g.setFill(p.getTarget());
        g.fillOval(x + s * 0.18, y + s * 0.18, s * 0.64, s * 0.64);
    }
}
