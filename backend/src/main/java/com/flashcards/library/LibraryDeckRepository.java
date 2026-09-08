package com.flashcards.library;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LibraryDeckRepository extends JpaRepository<LibraryDeck, UUID> {

    List<LibraryDeck> findByGroupIdOrderByPositionAscIdAsc(UUID groupId);

    Optional<LibraryDeck> findByGroup_IdAndSlug(UUID groupId, String slug);

    @Query("""
            SELECT d FROM LibraryDeck d
            JOIN FETCH d.group
            WHERE d.id = :id
            """)
    Optional<LibraryDeck> findWithGroupById(@Param("id") UUID id);

    @Query("""
            SELECT d FROM LibraryDeck d
            JOIN FETCH d.group
            WHERE d.group.id IN :groupIds
            ORDER BY d.group.name ASC, d.position ASC, d.id ASC
            """)
    List<LibraryDeck> findByGroupIdIn(@Param("groupIds") Collection<UUID> groupIds);
}
