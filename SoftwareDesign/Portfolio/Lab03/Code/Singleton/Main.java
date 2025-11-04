// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab03.Code.Singleton;

public class Main {

    public static void main(String[] args) {
        new Main().run();
    }

    public void run() {
        TicketService svc = new TicketService();
        System.out.println(svc.create("Printer broken"));
        System.out.println(svc.create("Monitor flicker"));
    }
}
