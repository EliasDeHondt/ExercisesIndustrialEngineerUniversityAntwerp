// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Glacier;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.Palette;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Box;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.GroundTile;
import javafx.scene.canvas.GraphicsContext;
import javafx.scene.paint.Color;

public final class GlacierBox extends Box {
    @Override
    public boolean slidesOn(GroundTile tile) {
        return tile.isSlippery();
    }

    @Override
    public void render(GraphicsContext g, Palette p, int x, int y, int s, boolean isTarget) {
        Color c = p.getBox();
        if (isTarget) {
            c = p.getBox().interpolate(p.getTarget(), 0.35);
        }
        g.setFill(c);
        g.fillRect(x + 2, y + 2, s - 4, s - 4);
    }
}