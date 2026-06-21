package openu.auction.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "ITEMS")
@Data
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    private Double startingPrice;
    private LocalDateTime endTime;

    private Long sellerId; // Retreived from context in spec

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @Version
    private Integer version; // Optimistic Locking

    private Double currentPrice;
    private Long winnerId;
    private String status = "ACTIVE";

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<ItemImage> images;

    @Transient
    private List<Map<String, Object>> lastBids;
}