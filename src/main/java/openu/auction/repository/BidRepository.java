package openu.auction.repository;

import openu.auction.model.Bid;
import openu.auction.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findTop5ByItemOrderByBidTimeDesc(Item item);
}
