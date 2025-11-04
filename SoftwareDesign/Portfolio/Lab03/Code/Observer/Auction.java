// @author EliasDH Team
// @see https://eliasdh.com
// @since 01/01/2025

package SoftwareDesign.Portfolio.Lab03.Code.Observer;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class Auction implements Subject {
    private Set<Observer> observers = ConcurrentHashMap.newKeySet();
    private Bid highest;

    @Override
    public void addObserver(Observer o) {
        observers.add(o);
    }

    @Override
    public void removeObserver(Observer o) {
        observers.remove(o);
    }

    @Override
    public void notifyObservers(String event, Object payload) {
        for (Observer o : observers) {
            o.update(event, payload);
        }
    }

    public void place(Bid bid) {
        if (highest == null || bid.getAmount() > highest.getAmount()) {
            highest = bid;
        }
        notifyObservers("bidPlaced", bid);
    }

    public Bid highest() {
        return highest;
    }
}