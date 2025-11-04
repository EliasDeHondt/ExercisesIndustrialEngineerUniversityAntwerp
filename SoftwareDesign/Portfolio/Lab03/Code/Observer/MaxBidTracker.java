// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab03.Code.Observer;

public class MaxBidTracker implements Observer {
    private int max = 0;

    @Override
    public void update(String event, Object payload) {
        if ("bidPlaced".equals(event) && payload instanceof Bid) {
            Bid bid = (Bid) payload;
            if (bid.getAmount() > max) {
                max = bid.getAmount();
            }
        }
    }

    public int getMax() {
        return max;
    }
}