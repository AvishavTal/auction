package openu.auction.auction;

import openu.auction.model.Bid;
import openu.auction.model.Item;
import openu.auction.model.User;
import openu.auction.repository.BidRepository;
import openu.auction.repository.ItemRepository;
import openu.auction.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class AuctionScheduler {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private BidRepository bidRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuctionNotificationProducer notificationProducer;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void closeExpiredAuctions() {
        List<Item> expired = itemRepository.findByStatusAndEndTimeBefore("ACTIVE", LocalDateTime.now());

        for (Item item : expired) {
            List<Bid> bids = bidRepository.findByItem(item);
            Long winnerId = bids.stream()
                    .max(java.util.Comparator.comparingDouble(Bid::getAmount))
                    .map(Bid::getUserId)
                    .orElse(null);

            item.setWinnerId(winnerId);
            item.setStatus("SOLD");
            itemRepository.save(item);

            System.out.println("Auction closed: " + item.getTitle() + " | Winner: " + winnerId);

            // Collect notifications to send after transaction commits
            List<NotificationEvent> events = new java.util.ArrayList<>();

            if (winnerId != null) {
                userRepository.findById(winnerId).ifPresent(winner ->
                    events.add(new NotificationEvent(
                            NotificationEvent.Type.AUCTION_WINNER,
                            winner.getEmail(), winner.getUsername(),
                            item.getTitle(), item.getCurrentPrice()
                    ))
                );
            }

            if (item.getSellerId() != null) {
                userRepository.findById(item.getSellerId()).ifPresent(seller ->
                    events.add(new NotificationEvent(
                            NotificationEvent.Type.AUCTION_SELLER,
                            seller.getEmail(), seller.getUsername(),
                            item.getTitle(), item.getCurrentPrice()
                    ))
                );
            }

            bids.stream()
                    .map(Bid::getUserId)
                    .distinct()
                    .filter(uid -> !uid.equals(winnerId))
                    .forEach(uid -> userRepository.findById(uid).ifPresent(user ->
                        events.add(new NotificationEvent(
                                NotificationEvent.Type.AUCTION_OUTBID,
                                user.getEmail(), user.getUsername(),
                                item.getTitle(), item.getCurrentPrice()
                        ))
                    ));

            // Send all JMS messages after commit so consumer reads committed winnerId
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    events.forEach(notificationProducer::sendNotification);
                }
            });
        }
    }
}
