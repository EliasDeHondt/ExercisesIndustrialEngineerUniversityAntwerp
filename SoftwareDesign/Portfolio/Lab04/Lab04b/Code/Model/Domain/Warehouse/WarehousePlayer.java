// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Warehouse;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.Palette;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain.Player;
import javafx.scene.canvas.GraphicsContext;

public final class WarehousePlayer extends Player {
    @Override
    public void render(GraphicsContext g, Palette p, int x, int y, int s, boolean isTarget) {
        g.setFill(p.getPlayer());
        g.fillRoundRect(x, y, s, s, s * 0.22, s * 0.22);
    }
}