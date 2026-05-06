package openu.auction.controller;

import openu.auction.model.*;
import openu.auction.service.ItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/")
public class ItemController {

    @Autowired
    private ItemService itemService;

    @PostMapping("/media/upload")
    public ResponseEntity<Map<String, String>> uploadMedia(@RequestParam("file") MultipartFile file) {
        String filename = itemService.saveFile(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("imagePath", filename));
    }

    @PostMapping("/items")
    public ResponseEntity<ItemResponse> createItem(@RequestBody CreateItemRequest request) {
        ItemResponse created = itemService.createItem(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/items")
    public List<ItemResponse> getAllItems() {
        return itemService.findAll();
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<ItemResponse> getItemById(@PathVariable Long id) {
        return itemService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}