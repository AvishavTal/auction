package openu.auction.service;

import openu.auction.model.*;
import openu.auction.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@Service
public class ItemService {

    @Value("${UPLOAD_DIR}")
    private String uploadDir;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private BidService bidService;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll(); // Supports GET /api/categories
    }

    public Path resolveFile(String filename) {
        return Paths.get(uploadDir).resolve(filename).normalize();
    }

    public String saveFile(MultipartFile file) {
        try {
            // Generate unique filename as per spec
            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path root = Paths.get(uploadDir);

            if (!Files.exists(root)) {
                Files.createDirectories(root);
            }

            Files.copy(file.getInputStream(), root.resolve(filename));
            return filename; // Path used for ITEM_IMAGES table
        } catch (IOException e) {
            throw new RuntimeException("Could not store file", e);
        }
    }

    @Transactional
    public Item createItem(Item item) {
        // Business Validation
        if (item.getStartingPrice() == null || item.getStartingPrice() <= 0) {
            throw new IllegalArgumentException("Starting price must be greater than 0");
        }

        // Ensure child ItemImage entities point back to the Item for JPA cascading
        if (item.getImages() != null) {
            item.getImages().forEach(img -> img.setItem(item));
        }

        return itemRepository.save(item);
    }

    public Optional<Item> findById(Long id) {
        return itemRepository.findById(id).map(item -> {
            item.setLastBids(bidService.getLastBids(item));
            return item;
        });
    }

    public Item save(Item item) {
        return itemRepository.save(item);
    }

    public List<Item> findAll() {
        return itemRepository.findAll();
    }

    public List<Item> search(String keyword, Long categoryId, Double minPrice, Double maxPrice) {
        List<Specification<Item>> specs = new ArrayList<>();

        if (keyword != null && !keyword.isBlank())
            specs.add((root, query, cb) -> cb.like(cb.lower(root.get("title")), "%" + keyword.toLowerCase() + "%"));
        if (categoryId != null)
            specs.add((root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId));
        if (minPrice != null)
            specs.add((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("startingPrice"), minPrice));
        if (maxPrice != null)
            specs.add((root, query, cb) -> cb.lessThanOrEqualTo(root.get("startingPrice"), maxPrice));

        if (specs.isEmpty()) return itemRepository.findAll();

        Specification<Item> spec = specs.get(0);
        for (int i = 1; i < specs.size(); i++) spec = spec.and(specs.get(i));

        return itemRepository.findAll(spec);
    }
}