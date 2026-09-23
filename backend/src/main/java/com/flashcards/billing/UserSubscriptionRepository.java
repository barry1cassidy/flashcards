package com.flashcards.billing;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, UUID> {

    Optional<UserSubscription> findByProviderAndProviderSubscriptionId(
            BillingProvider provider, String providerSubscriptionId);

    List<UserSubscription> findByUser_Id(UUID userId);

    List<UserSubscription> findByUser_IdAndProvider(UUID userId, BillingProvider provider);
}
