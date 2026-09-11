package com.flashcards.group;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DeckGroupRepository extends JpaRepository<DeckGroup, UUID> {

    List<DeckGroup> findByUserIdOrderByNameAsc(UUID userId);

    Optional<DeckGroup> findByIdAndUserId(UUID id, UUID userId);

    Optional<DeckGroup> findByUser_IdAndNameIgnoreCase(UUID userId, String name);

    List<DeckGroup> findByIdInAndUser_Id(Collection<UUID> ids, UUID userId);
}
