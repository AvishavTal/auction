package openu.auction.controller;

import openu.auction.model.User;
import openu.auction.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        try {
            User user = userService.register(
                    body.get("fullName"),
                    body.get("username"),
                    body.get("email"),
                    body.get("password")
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            User user = userService.login(body.get("username"), body.get("password"));
            return ResponseEntity.ok(toResponse(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    private Map<String, Object> toResponse(User user) {
        return Map.of("id", user.getId(), "username", user.getUsername(), "fullName", user.getFullName());
    }
}
