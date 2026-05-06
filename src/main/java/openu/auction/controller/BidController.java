package openu.auction.controller;

import openu.auction.model.BidRequest;
import openu.auction.model.ItemResponse;
import openu.auction.service.ItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/bids")
public class BidController {

    @Autowired
    private ItemService itemService;

    @PostMapping
    public ResponseEntity<Object> placeBid(@RequestBody BidRequest request) {
        try {
            ItemResponse response = itemService.placeBid(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
