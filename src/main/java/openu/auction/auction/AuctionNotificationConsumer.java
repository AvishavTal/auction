package openu.auction.auction;

import openu.auction.model.Bid;
import openu.auction.model.Item;
import openu.auction.model.User;
import openu.auction.repository.BidRepository;
import openu.auction.repository.ItemRepository;
import openu.auction.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AuctionNotificationConsumer {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private BidRepository bidRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JavaMailSender mailSender;

    @JmsListener(destination = "auction.closed")
    public void onAuctionClosed(Long itemId) {
        Item item = itemRepository.findById(itemId).orElse(null);
        if (item == null) return;

        // Notify winner
        if (item.getWinnerId() != null) {
            userRepository.findById(item.getWinnerId()).ifPresent(winner -> {
                if (winner.getEmail() != null) {
                    sendEmail(winner.getEmail(),
                            "זכית במכרז! - " + item.getTitle(),
                            "שלום " + winner.getUsername() + ",\n\n" +
                            "זכית במכרז עבור: " + item.getTitle() + "\n" +
                            "מחיר סופי: " + item.getCurrentPrice() + " ש\"ח\n\n" +
                            "ברכות!"
                    );
                }
            });
        }

        // Notify all other bidders
        List<Bid> allBids = bidRepository.findTop5ByItemOrderByBidTimeDesc(item);
        allBids.stream()
                .map(Bid::getUserId)
                .distinct()
                .filter(uid -> !uid.equals(item.getWinnerId()))
                .forEach(uid -> userRepository.findById(uid).ifPresent(user -> {
                    if (user.getEmail() != null) {
                        sendEmail(user.getEmail(),
                                "המכרז הסתיים - " + item.getTitle(),
                                "שלום " + user.getUsername() + ",\n\n" +
                                "המכרז עבור " + item.getTitle() + " הסתיים.\n" +
                                "לצערנו, לא זכית הפעם.\n\n" +
                                "בהצלחה בפעם הבאה!"
                        );
                    }
                }));
    }

    private void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("auction@system.com");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
        }
    }
}
