package openu.auction.controller;

import openu.auction.model.*;
import openu.auction.repository.BidRepository;
import openu.auction.repository.ItemRepository;
import openu.auction.service.ItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/")
public class ItemController {

    @Autowired
    private ItemService itemService;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private BidRepository bidRepository;

    @PostMapping("/items")
    public ResponseEntity<Item> createItem(@RequestBody Item item) {
        Item savedItem = itemService.createItem(item);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedItem);
    }

    @GetMapping("/items")
    public List<Item> getAllItems(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice) {
        return itemService.search(keyword, categoryId, minPrice, maxPrice);
    }
    @GetMapping("/items/{id}")
    public ResponseEntity<Item> getItemById(@PathVariable Long id) {
        return itemService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/activity?userId=X — returns bids/sales/wins for the My Activity page
    @GetMapping("/activity")
    public Map<String, List<Item>> getActivity(@RequestParam Long userId) {
        // Items the user bid on
        List<Item> bidItems = bidRepository.findByUserIdOrderByBidTimeDesc(userId)
                .stream()
                .map(bid -> bid.getItem())
                .distinct()
                .collect(Collectors.toList());

        // Items the user published
        List<Item> saleItems = itemRepository.findBySellerId(userId);

        // Items the user won
        List<Item> winItems = itemRepository.findByWinnerId(userId);

        return Map.of("bids", bidItems, "sales", saleItems, "wins", winItems);
    }

    // DEV ONLY: fast-forward item end time to 10 seconds from now
    @PostMapping("/items/{id}/expire-now")
    public ResponseEntity<?> expireNow(@PathVariable Long id) {
        return itemService.findById(id).map(item -> {
            item.setEndTime(LocalDateTime.now().plusSeconds(10));
            itemService.save(item);
            return ResponseEntity.ok("Item " + id + " will expire in 10 seconds");
        }).orElse(ResponseEntity.notFound().build());
    }
}