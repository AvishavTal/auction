package openu.auction.controller;

import jakarta.persistence.OptimisticLockException;
import openu.auction.model.Bid;
import openu.auction.service.BidService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import java.util.Map;

@RestController
@RequestMapping("/api/bids")
public class BidController {

    @Autowired
    private BidService bidService;

    @PostMapping
    public ResponseEntity<?> placeBid(@RequestBody Map<String, Object> body) {
        try {
            Long itemId = Long.valueOf(body.get("itemId").toString());
            Long userId = Long.valueOf(body.get("userId").toString());
            Double amount = body.get("amount") != null ? Double.valueOf(body.get("amount").toString()) : null;
            Double maxProxyAmount = body.get("maxProxyAmount") != null
                    ? Double.valueOf(body.get("maxProxyAmount").toString())
                    : null;

            Bid bid = bidService.placeBid(itemId, userId, amount, maxProxyAmount);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "CREATED", "bidId", bid.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (ObjectOptimisticLockingFailureException | OptimisticLockException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "הצעה אחרת התקבלה ברגע זה — אנא רענן ונסה שוב"));
        }
    }
}
