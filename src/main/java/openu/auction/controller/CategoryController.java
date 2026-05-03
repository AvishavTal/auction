package openu.auction.controller;

import openu.auction.model.Category;
import openu.auction.service.ItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private ItemService itemService;

    @GetMapping
    public List<Category> getCategories() {
        return itemService.getAllCategories();
    }
}
