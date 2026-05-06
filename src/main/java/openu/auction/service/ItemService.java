package openu.auction.service;

import openu.auction.model.*;
import openu.auction.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ItemService {

    private static final double BID_INCREMENT = 1.0;

    @Value("${UPLOAD_DIR}")
    private String uploadDir;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private BidRepository bidRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public String saveFile(MultipartFile file) {
        try {
            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path root = Paths.get(uploadDir);

            if (!Files.exists(root)) {
                Files.createDirectories(root);
            }

            Files.copy(file.getInputStream(), root.resolve(filename));
            return filename;
        } catch (IOException e) {
            throw new RuntimeException("Could not store file", e);
        }
    }

    @Transactional
    public ItemResponse createItem(CreateItemRequest request) {
        if (request.getStartingPrice() == null || request.getStartingPrice() <= 0) {
            throw new IllegalArgumentException("Starting price must be greater than 0");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + request.getCategoryId()));

        Item item = new Item();
        item.setTitle(request.getTitle());
        item.setDescription(request.getDescription());
        item.setStartingPrice(request.getStartingPrice());
        item.setCurrentPrice(request.getStartingPrice());
        item.setEndTime(request.getEndTime());
        item.setSellerId(request.getSellerId());
        item.setCategory(category);

        Item saved = itemRepository.save(item);

        if (request.getImagePaths() != null) {
            for (String path : request.getImagePaths()) {
                ItemImage img = new ItemImage();
                img.setImageUrl(path);
                img.setItem(saved);
                saved.getImages().add(img);
            }
            saved = itemRepository.save(saved);
        }

        return toResponse(saved, List.of());
    }

    public Optional<ItemResponse> findById(Long id) {
        return itemRepository.findById(id).map(item -> {
            List<Bid> recentBids = bidRepository.findTop5ByItemIdOrderByBidTimeDesc(id);
            return toResponse(item, recentBids);
        });
    }

    public List<ItemResponse> findAll() {
        return itemRepository.findAll().stream()
                .map(item -> toResponse(item, List.of()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ItemResponse placeBid(BidRequest request) {
        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + request.getItemId()));

        if (item.getEndTime() != null && item.getEndTime().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Auction has already ended");
        }

        String username = (request.getUsername() != null && !request.getUsername().isBlank())
                ? request.getUsername() : "anonymous";

        double newPrice;
        boolean isProxy = false;

        if (request.getMaxProxyAmount() != null && request.getMaxProxyAmount() > 0) {
            // Proxy bid: bid up to maxProxyAmount in increments
            isProxy = true;
            double currentPrice = item.getCurrentPrice();
            if (request.getMaxProxyAmount() <= currentPrice) {
                throw new IllegalArgumentException("Proxy max must exceed current price of " + currentPrice);
            }
            newPrice = Math.min(request.getMaxProxyAmount(), currentPrice + BID_INCREMENT);
        } else {
            // Manual bid
            double amount = request.getAmount() != null ? request.getAmount() : 0;
            if (amount <= item.getCurrentPrice()) {
                throw new IllegalArgumentException("Bid must exceed current price of " + item.getCurrentPrice());
            }
            newPrice = amount;
        }

        Bid bid = new Bid();
        bid.setItem(item);
        bid.setUsername(username);
        bid.setAmount(newPrice);
        bid.setMaxProxyAmount(request.getMaxProxyAmount());
        bid.setIsProxy(isProxy);
        bid.setBidTime(LocalDateTime.now());
        bidRepository.save(bid);

        item.setCurrentPrice(newPrice);
        itemRepository.save(item);

        List<Bid> recentBids = bidRepository.findTop5ByItemIdOrderByBidTimeDesc(item.getId());
        return toResponse(item, recentBids);
    }

    private ItemResponse toResponse(Item item, List<Bid> recentBids) {
        ItemResponse r = new ItemResponse();
        r.setId(item.getId());
        r.setTitle(item.getTitle());
        r.setDescription(item.getDescription());
        r.setStartingPrice(item.getStartingPrice());
        r.setCurrentPrice(item.getCurrentPrice());
        r.setEndTime(item.getEndTime());
        r.setSellerId(item.getSellerId());
        r.setCategory(item.getCategory());

        List<String> paths = item.getImages() == null ? List.of()
                : item.getImages().stream().map(ItemImage::getImageUrl).collect(Collectors.toList());
        r.setImagePaths(paths);

        List<ItemResponse.BidSummary> summaries = recentBids.stream().map(b -> {
            ItemResponse.BidSummary s = new ItemResponse.BidSummary();
            s.setUsername(b.getUsername());
            s.setAmount(b.getAmount());
            s.setIsProxy(b.getIsProxy());
            s.setBidTime(b.getBidTime());
            return s;
        }).collect(Collectors.toList());
        r.setLastBids(summaries);

        return r;
    }
}
