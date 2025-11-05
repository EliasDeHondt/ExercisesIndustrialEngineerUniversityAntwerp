// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Domain;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.Palette;
import javafx.scene.canvas.GraphicsContext;

public abstract class GroundTile {
    public abstract boolean isSolid();

    public abstract boolean isSlippery();

    public abstract boolean isTarget();

    public abstract void render(GraphicsContext g, Palette p, int x, int y, int s);
}