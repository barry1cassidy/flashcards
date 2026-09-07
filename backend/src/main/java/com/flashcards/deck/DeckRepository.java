package com.flashcards.deck;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeckRepository extends JpaRepository<Deck, UUID> {

    @Query("""
            SELECT d FROM Deck d
            LEFT JOIN FETCH d.group
            WHERE d.user.id = :userId
            ORDER BY d.updatedAt DESC
            """)
    List<Deck> findByUserIdOrderByUpdatedAtDesc(@Param("userId") UUID userId);

    @Query("""
            SELECT d FROM Deck d
            LEFT JOIN FETCH d.group
            WHERE d.id = :id AND d.user.id = :userId
            """)
    Optional<Deck> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    @Query("""
            SELECT d FROM Deck d
            LEFT JOIN FETCH d.group
            WHERE d.group.id = :groupId AND d.user.id = :userId
            ORDER BY d.updatedAt DESC
            """)
    List<Deck> findByGroupIdAndUserId(@Param("groupId") UUID groupId, @Param("userId") UUID userId);

    Optional<Deck> findByUser_IdAndLibraryDeckId(UUID userId, UUID libraryDeckId);

    List<Deck> findByUser_IdAndLibraryDeckIdIn(UUID userId, Collection<UUID> libraryDeckIds);

    long countByGroupId(UUID groupId);
}
