package com.flashcards.user;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleSub(String googleSub);

    Optional<User> findByAppleSub(String appleSub);

    boolean existsByEmail(String email);

    Optional<User> findByStripeCustomerId(String stripeCustomerId);

    List<User> findAllByOrderByCreatedAtDesc();

    List<User> findByEmailContainingIgnoreCaseOrDisplayNameContainingIgnoreCaseOrderByCreatedAtDesc(
            String email, String displayName);
}
