// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Ui;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Config.AppConfig;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.LevelKit;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Level.Palette;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.Cell;
import SoftwareDesign.Portfolio.Lab04.Lab04b.Code.Model.World;
import javafx.scene.canvas.GraphicsContext;

public final class GridRenderer {
    private final AppConfig C = AppConfig.get();
    private final Palette P;
    private final LevelKit.RendererHints H;

    public GridRenderer(Palette palette, LevelKit.RendererHints hints) {
        this.P = palette;
        this.H = hints;
    }

    public void draw(GraphicsContext g, World w) {
        final int TILE = C.tilePx, PAD = C.paddingPx;

        // 0) Background for the whole scene (fits both worlds)
        g.setFill(P.getBackground());
        g.fillRect(0, 0, w.w * TILE + PAD * 2, w.h * TILE + C.legendHeightPx + PAD * 2);

        // 1) Clear the grid area overlay so tiles are crisp
        g.clearRect(PAD, PAD, w.w * TILE, w.h * TILE);

        for (int y = 0; y < w.h; y++)
            for (int x = 0; x < w.w; x++) {
                int sx = PAD + x * TILE, sy = PAD + y * TILE;
                Cell c = w.get(x, y);
                c.ground.render(g, P, sx, sy, TILE);
                if (!c.isEmpty()) c.thing.render(g, P, sx, sy, TILE, c.isTarget());
            }
    }
}