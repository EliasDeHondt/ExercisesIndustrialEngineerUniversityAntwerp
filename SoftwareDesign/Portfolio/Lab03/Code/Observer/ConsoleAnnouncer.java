// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab03.Code.Observer;

public class ConsoleAnnouncer implements Observer {

    @Override
    public void update(String event, Object payload) {
        if ("bidPlaced".equals(event) && payload instanceof Bid) {
            Bid bid = (Bid) payload;
            System.out.println(bid.getBidder() + " placed a bid of " + bid.getAmount());
        }
    }
}