package openu.auction.model;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateItemRequest {
    private String title;
    private String description;
    private Double startingPrice;
    private LocalDateTime endTime;
    private Long categoryId;
    private List<String> imagePaths;
    private Long sellerId;
}
