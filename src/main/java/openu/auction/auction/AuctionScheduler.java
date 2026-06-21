package openu.auction.auction;

import openu.auction.model.Bid;
import openu.auction.model.Item;
import openu.auction.repository.BidRepository;
import openu.auction.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class AuctionScheduler {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private BidRepository bidRepository;

    @Autowired
    private AuctionNotificationProducer notificationProducer;

    @Scheduled(fixedRate = 60000) // runs every minute
    @Transactional
    public void closeExpiredAuctions() {
        List<Item> expired = itemRepository.findByStatusAndEndTimeBefore("ACTIVE", LocalDateTime.now());

        for (Item item : expired) {
            // Find the winner — highest bid
            List<Bid> bids = bidRepository.findTop5ByItemOrderByBidTimeDesc(item);
            if (!bids.isEmpty()) {
                item.setWinnerId(bids.get(0).getUserId());
            }

            item.setStatus("SOLD");
            itemRepository.save(item);

            // Send JMS message — consumer handles emails asynchronously
            notificationProducer.sendClosedNotification(item.getId());

            System.out.println("Auction closed: " + item.getTitle() + " | Winner: " + item.getWinnerId());
        }
    }
}
