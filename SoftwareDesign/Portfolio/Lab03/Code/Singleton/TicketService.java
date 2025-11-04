// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab03.Code.Singleton;

public class TicketService {
    public Ticket create(String title) {
        IdGenerator generator = IdGenerator.getInstance();
        long newId = generator.nextId();
        return new Ticket(newId, title);
    }
}