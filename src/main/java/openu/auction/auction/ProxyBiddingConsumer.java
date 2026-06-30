package openu.auction.auction;

import openu.auction.model.Bid;
import openu.auction.model.Item;
import openu.auction.repository.BidRepository;
import openu.auction.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;


@Component
public class ProxyBiddingConsumer {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private BidRepository bidRepository;

    @JmsListener(destination = "auction.proxy")
    @Transactional
    public void resolveProxyBids(Long itemId) {
        Item item = itemRepository.findById(itemId).orElse(null);
        if (item == null || !"ACTIVE".equals(item.getStatus())) return;

        List<Bid> allBids = bidRepository.findByItem(item);

        // Keep only the best bid per user (highest effectiveMax, earliest on tie)
        Map<Long, Bid> bestPerUser = new java.util.LinkedHashMap<>();
        for (Bid b : allBids) {
            bestPerUser.merge(b.getUserId(), b, (existing, incoming) ->
                    effectiveMax(incoming) > effectiveMax(existing) ? incoming : existing);
        }

        List<Bid> topBids = new java.util.ArrayList<>(bestPerUser.values());
        if (topBids.size() < 2) return; // need at least 2 distinct bidders

        // Sort by effective ceiling DESC, then by bidTime ASC (earlier proxy wins tie)
        topBids.sort(Comparator
                .comparingDouble((Bid b) -> effectiveMax(b))
                .reversed()
                .thenComparing(Bid::getBidTime));

        Bid winner = topBids.get(0);
        Bid runnerUp = topBids.get(1);

        double runnerUpMax = effectiveMax(runnerUp);
        double winnerMax = effectiveMax(winner);

        // Winner pays just one increment above the runner-up (not their full max)
        double newPrice = Math.min(winnerMax, runnerUpMax + increment(runnerUpMax));

        if (newPrice <= (item.getCurrentPrice() != null ? item.getCurrentPrice() : item.getStartingPrice())) {
            return; // price didn't change, nothing to do
        }

        item.setCurrentPrice(newPrice);
        itemRepository.save(item);

        // Record a visible proxy bid for the winner at the resolved price
        Bid proxyBid = new Bid();
        proxyBid.setItem(item);
        proxyBid.setUserId(winner.getUserId());
        proxyBid.setAmount(newPrice);
        proxyBid.setMaxProxyAmount(winner.getMaxProxyAmount());
        proxyBid.setBidTime(LocalDateTime.now());
        proxyBid.setProxy(true);
        bidRepository.save(proxyBid);
    }

    private double effectiveMax(Bid bid) {
        double proxy = bid.getMaxProxyAmount() != null ? bid.getMaxProxyAmount() : 0;
        double manual = bid.getAmount() != null ? bid.getAmount() : 0;
        return Math.max(proxy, manual);
    }

    private double increment(double price) {
        if (price < 100) return 5;
        if (price < 1000) return 10;
        return 50;
    }
}
