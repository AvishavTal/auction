package openu.auction.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "BIDS")
@Data
public class Bid {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private Double amount;

    private Double maxProxyAmount;

    @Column(nullable = false)
    private Boolean isProxy;

    @Column(nullable = false)
    private LocalDateTime bidTime;
}
