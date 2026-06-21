package openu.auction.auction;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Component;

@Component
public class AuctionNotificationProducer {

    @Autowired
    private JmsTemplate jmsTemplate;

    public void sendClosedNotification(Long itemId) {
        jmsTemplate.convertAndSend("auction.closed", itemId);
    }
}
