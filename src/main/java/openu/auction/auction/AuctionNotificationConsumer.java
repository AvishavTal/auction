package openu.auction.auction;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
public class AuctionNotificationConsumer {

    @Autowired
    private JavaMailSender mailSender;

    @JmsListener(destination = "auction.notify")
    public void onNotification(NotificationEvent event) {
        if (event.getToEmail() == null) return;

        String subject;
        String body;

        switch (event.getType()) {
            case AUCTION_WINNER -> {
                subject = "זכית במכרז! - " + event.getItemTitle();
                body = "שלום " + event.getToUsername() + ",\n\n" +
                       "זכית במכרז עבור: " + event.getItemTitle() + "\n" +
                       "מחיר סופי: " + event.getFinalPrice() + " ש\"ח\n\n" +
                       "ברכות!";
            }
            case AUCTION_SELLER -> {
                subject = "המכרז שלך הסתיים - " + event.getItemTitle();
                body = event.getFinalPrice() != null
                        ? "שלום " + event.getToUsername() + ",\n\nהמכרז שלך עבור: " + event.getItemTitle() + " הסתיים בהצלחה!\nמחיר סופי: " + event.getFinalPrice() + " ש\"ח\n\nברכות!"
                        : "שלום " + event.getToUsername() + ",\n\nהמכרז שלך עבור: " + event.getItemTitle() + " הסתיים ללא זוכה.";
            }
            case AUCTION_OUTBID -> {
                subject = "המכרז הסתיים - " + event.getItemTitle();
                body = "שלום " + event.getToUsername() + ",\n\n" +
                       "המכרז עבור " + event.getItemTitle() + " הסתיים.\n" +
                       "לצערנו, לא זכית הפעם.\n\n" +
                       "בהצלחה בפעם הבאה!";
            }
            default -> { return; }
        }

        sendEmail(event.getToEmail(), subject, body);
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
