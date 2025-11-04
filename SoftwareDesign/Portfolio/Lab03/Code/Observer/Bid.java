// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab03.Code.Observer;

public class Bid {
    private String bidder;
    private int amount;

    public Bid(String bidder, int amount) {
        this.bidder = bidder;
        this.amount = amount;
    }

    public String getBidder() {
        return bidder;
    }

    public void setBidder(String bidder) {
        this.bidder = bidder;
    }

    public int getAmount() {
        return this.amount;
    }

    public void setAmount(int amount) {
        this.amount = amount;
    }
}