// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab05.Code;
import SoftwareDesign.Portfolio.Lab05.Code.Controller.Controller;
import SoftwareDesign.Portfolio.Lab05.Code.Controller.RegistrationController;
import SoftwareDesign.Portfolio.Lab05.Code.Database.Database;
import SoftwareDesign.Portfolio.Lab05.Code.Database.RegistrationDB;
import SoftwareDesign.Portfolio.Lab05.Code.View.View;
import SoftwareDesign.Portfolio.Lab05.Code.Viewfx.RegistrationView;
import javafx.application.Application;
import javafx.scene.Scene;
import javafx.stage.Stage;

public class ViewApp extends Application {
    public static void main(String[] args) {
        launch(args);
    }

    @Override
    public void start(Stage stage) {
        Database model = new RegistrationDB();

        Controller controller = new RegistrationController(model);

        RegistrationView view = new RegistrationView();

        View viewLogic = new View(model, controller, view);

        view.attachLogic(viewLogic);

        Scene scene = new Scene(view, 960, 560);
        stage.setTitle("Lab 5 — GoF MVC");
        stage.setScene(scene);
        stage.show();
    }
}