package com.flashcards.share;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContentShareRepository extends JpaRepository<ContentShare, UUID> {

    boolean existsByCode(String code);

    Optional<ContentShare> findByDeck_Id(UUID deckId);

    Optional<ContentShare> findByGroup_Id(UUID groupId);

    @Query("""
            SELECT s FROM ContentShare s
            JOIN FETCH s.owner
            LEFT JOIN FETCH s.deck
            LEFT JOIN FETCH s.group
            WHERE s.code = :code
            """)
    Optional<ContentShare> findByCodeWithTarget(@Param("code") String code);
}
