package openu.auction.auction;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Component;

@Component
public class ProxyBiddingProducer {

    @Autowired
    private JmsTemplate jmsTemplate;

    public void triggerProxyResolution(Long itemId) {
        jmsTemplate.convertAndSend("auction.proxy", itemId);
    }
}
