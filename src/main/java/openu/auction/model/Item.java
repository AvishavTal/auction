package openu.auction.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
    private Double currentPrice;
    private LocalDateTime endTime;

    private Long sellerId;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @Version
    private Integer version;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<ItemImage> images = new ArrayList<>();
}