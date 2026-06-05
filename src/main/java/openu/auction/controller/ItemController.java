package openu.auction.controller;

import openu.auction.model.*;
import openu.auction.service.ItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/")
public class ItemController {

    @Autowired
    private ItemService itemService;

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
                .orElse(ResponseEntity.notFound().build()); // Returns 404 if ID doesn't exist
    }
}