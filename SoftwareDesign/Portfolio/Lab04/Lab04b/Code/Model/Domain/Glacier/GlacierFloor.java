// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Glacier;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.Palette;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.GroundTile;
import javafx.scene.canvas.GraphicsContext;

public final class GlacierFloor extends GroundTile {
    @Override
    public boolean isSolid() {
        return false;
    }

    @Override
    public boolean isSlippery() {
        return true;
    }

    @Override
    public boolean isTarget() {
        return false;
    }

    @Override
    public void render(GraphicsContext g, Palette p, int x, int y, int s) {
        g.setFill(p.getFloor());
        g.fillRect(x, y, s, s);
    }
}