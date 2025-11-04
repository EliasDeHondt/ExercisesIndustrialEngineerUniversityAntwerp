// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab03.Code.Observer;

public class Main {
    public static void main(String[] args) {
        new Main().run();
    }

    public void run() {
        Auction auction = new Auction();
        MaxBidTracker tracker = new MaxBidTracker();
        auction.addObserver(tracker);
        auction.addObserver(new ConsoleAnnouncer());

        auction.place(new Bid("Alice", 100));
        auction.place(new Bid("Bob", 150));
        auction.place(new Bid("Charlie", 120));

        System.out.println("Tracked max bid: " + tracker.getMax());
    }
}