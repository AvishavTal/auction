package openu.auction.service;

import openu.auction.auction.ProxyBiddingProducer;
import openu.auction.model.Bid;
import openu.auction.model.Item;
import openu.auction.repository.BidRepository;
import openu.auction.repository.ItemRepository;
import openu.auction.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class BidService {

    @Autowired
    private BidRepository bidRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProxyBiddingProducer proxyBiddingProducer;

    @Transactional
    public Bid placeBid(Long itemId, Long userId, Double amount, Double maxProxyAmount) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("פריט לא נמצא"));

        if (!"ACTIVE".equals(item.getStatus())) {
            throw new IllegalArgumentException("המכרז כבר נסגר ולא ניתן להגיש הצעות");
        }

        if (item.getEndTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("זמן המכרז פג");
        }

        double effectiveAmount = (amount != null && amount > 0) ? amount
                : (maxProxyAmount != null ? maxProxyAmount : 0);

        double currentPrice = item.getCurrentPrice() != null ? item.getCurrentPrice() : item.getStartingPrice();

        if (effectiveAmount <= currentPrice) {
            throw new IllegalArgumentException("הצעה חייבת להיות גבוהה מהמחיר הנוכחי: " + currentPrice);
        }

        Bid bid = new Bid();
        bid.setItem(item);
        bid.setUserId(userId);
        bid.setAmount(effectiveAmount);
        bid.setMaxProxyAmount(maxProxyAmount);
        bid.setBidTime(LocalDateTime.now());
        bid.setProxy(maxProxyAmount != null && maxProxyAmount > 0);

        item.setCurrentPrice(effectiveAmount);

        // Soft close: extend by 5 minutes if bid placed in last 5 minutes
        if (item.getEndTime().minusMinutes(5).isBefore(LocalDateTime.now())) {
            item.setEndTime(item.getEndTime().plusMinutes(5));
        }

        itemRepository.save(item);
        Bid saved = bidRepository.save(bid);

        // Send JMS after commit so the consumer reads fresh data
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                proxyBiddingProducer.triggerProxyResolution(itemId);
            }
        });

        return saved;
    }

    public List<Map<String, Object>> getLastBids(Item item) {
        return bidRepository.findTop5ByItemOrderByBidTimeDesc(item)
                .stream()
                .map(bid -> {
                    String username = userRepository.findById(bid.getUserId())
                            .map(u -> u.getUsername())
                            .orElse("משתמש #" + bid.getUserId());
                    return Map.<String, Object>of(
                            "username", username,
                            "amount",   bid.getAmount(),
                            "bidTime",  bid.getBidTime().toString(),
                            "isProxy",  bid.isProxy()
                    );
                })
                .toList();
    }
}
