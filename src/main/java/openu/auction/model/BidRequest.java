package openu.auction.model;

import lombok.Data;

@Data
public class BidRequest {
    private Long itemId;
    private Double amount;
    private Double maxProxyAmount;
    private String username;
}
