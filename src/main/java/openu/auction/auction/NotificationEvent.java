package openu.auction.auction;

import java.io.Serializable;

public class NotificationEvent implements Serializable {

    public enum Type { AUCTION_WINNER, AUCTION_OUTBID, AUCTION_SELLER }

    private Type type;
    private String toEmail;
    private String toUsername;
    private String itemTitle;
    private Double finalPrice;

    public NotificationEvent() {}

    public NotificationEvent(Type type, String toEmail, String toUsername, String itemTitle, Double finalPrice) {
        this.type = type;
        this.toEmail = toEmail;
        this.toUsername = toUsername;
        this.itemTitle = itemTitle;
        this.finalPrice = finalPrice;
    }

    public Type getType() { return type; }
    public String getToEmail() { return toEmail; }
    public String getToUsername() { return toUsername; }
    public String getItemTitle() { return itemTitle; }
    public Double getFinalPrice() { return finalPrice; }
}
