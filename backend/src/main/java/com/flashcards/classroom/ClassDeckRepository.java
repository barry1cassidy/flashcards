package com.flashcards.classroom;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClassDeckRepository extends JpaRepository<ClassDeck, UUID> {

    @Query("""
            SELECT d FROM ClassDeck d
            JOIN FETCH d.deck
            WHERE d.studyClass.id = :classId
            ORDER BY d.assignedAt ASC
            """)
    List<ClassDeck> findByStudyClass_IdOrderByAssignedAtAsc(@Param("classId") UUID classId);

    Optional<ClassDeck> findByStudyClass_IdAndDeck_Id(UUID classId, UUID deckId);

    boolean existsByStudyClass_IdAndDeck_Id(UUID classId, UUID deckId);

    long countByStudyClass_Id(UUID classId);

    void deleteByStudyClass_IdAndDeck_Id(UUID classId, UUID deckId);

    List<ClassDeck> findByStudyClass_IdIn(Collection<UUID> classIds);
}
