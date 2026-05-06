package openu.auction.model;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ItemResponse {

    private Long id;
    private String title;
    private String description;
    private Double startingPrice;
    private Double currentPrice;
    private LocalDateTime endTime;
    private Long sellerId;
    private Category category;
    private List<String> imagePaths;
    private List<BidSummary> lastBids;

    @Data
    public static class BidSummary {
        private String username;
        private Double amount;
        private Boolean isProxy;
        private LocalDateTime bidTime;
    }
}
