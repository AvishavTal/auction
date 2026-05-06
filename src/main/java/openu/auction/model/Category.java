package openu.auction.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Table(name = "CATEGORIES")
@Data
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Corresponds to id in spec

    @Column(nullable = false, unique = true)
    private String name; // Corresponds to name in spec

    // Bi-directional relationship (Optional, but helpful)
    @OneToMany(mappedBy = "category")
    @JsonBackReference
    private List<Item> items;

    // Standard Getters/Setters
}